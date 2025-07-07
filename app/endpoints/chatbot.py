from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import fitz  # PyMuPDF
from io import BytesIO
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
import os
from dotenv import load_dotenv
from pptx import Presentation  # For PPTX support
from app.core.shared_state import set_vector_db, add_file_metadata, clear_all, get_vector_db, get_uploaded_metadata

# Flag to disable FAISS vector search - set to False to disable
USE_VECTOR_SEARCH = True

chat_history = []

# Load environment variables (e.g., Google API key)
load_dotenv()

# Ensure API key is available - this is critical
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set. Please set it in your .env file or environment.")

# Initialize FastAPI app
app = FastAPI(title="CHATBOT API", description="A research paper analysis chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific domains if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Text extraction functions
def extract_text_from_file(file: UploadFile):
    """Extract text from uploaded file (PDF, TXT, PPTX)."""
    content = file.file.read()
    filename = file.filename

    if file.content_type == "application/pdf":
        doc = fitz.open(stream=content, filetype="pdf")
        return [{"text": page.get_text("text"), "page_number": i + 1} for i, page in enumerate(doc)]
    elif file.content_type == "text/plain":
        return [{"text": content.decode("utf-8"), "page_number": 1}]
    elif file.content_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        prs = Presentation(BytesIO(content))
        text = ""
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        return [{"text": text, "page_number": 1}]
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")


def process_files(files: List[UploadFile]):
    """Process uploaded files into a vector store."""
    # Clear previous metadata
    clear_all()

    # Process each file and save metadata
    for file in files:
        print(f"Processing file: {file.filename}")

        # Get file size
        file_size = 0
        try:
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
        except Exception as e:
            print(f"Error getting file size: {e}")

        # Extract pages
        pages = extract_text_from_file(file)

        # Save metadata
        file_metadata = {
            "filename": file.filename,
            "file_size": file_size,
            "page_count": len(pages),
            "content_type": file.content_type
        }
        add_file_metadata(file_metadata)
        print(f"Added file metadata: {file.filename}, {len(pages)} pages")

        # Only process for vector DB if enabled
        if USE_VECTOR_SEARCH:
            all_docs = []
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            
            for page in pages:
                chunks = text_splitter.split_text(page["text"])
                for i, chunk in enumerate(chunks):
                    metadata = {
                        "source": file.filename,
                        "page_number": page["page_number"],
                        "chunk_index": i,
                        "file_size": file_size
                    }
                    all_docs.append(Document(page_content=chunk, metadata=metadata))

            if all_docs:
                try:
                    # Use newer text-embedding model
                    embeddings = GoogleGenerativeAIEmbeddings(
                        model="models/text-embedding-004",  # Updated from embedding-001
                        google_api_key=GOOGLE_API_KEY
                    )

                    db = FAISS.from_documents(all_docs, embeddings)
                    set_vector_db(db)  # Store in shared state
                    print(f"Successfully created vector DB with {len(all_docs)} documents")
                except Exception as e:
                    print(f"Warning: Failed to create vector DB but continuing with file metadata: {e}")

    return {"message": "Files processed successfully", "file_count": len(files)}


def initialize_qa_chain():
    """Initialize the ConversationalRetrievalChain."""
    vector_db = get_vector_db()
    if vector_db is None:
        raise HTTPException(status_code=400, detail="No documents uploaded yet")

    template = """You are an expert research paper analyst. Use the following pieces of context to provide a detailed answer to the question. If you can't answer based on the context, say so.

Context:
{context}

Question: {question}

Previous conversation:
{chat_history}

Please provide a comprehensive response that:
1. Directly answers the question using information from the uploaded documents
2. Cites specific sources (e.g., document name and page number) when relevant
3. Explains technical concepts clearly
4. Uses examples when helpful
5. Maintains academic accuracy while being accessible

Answer:"""

    prompt = PromptTemplate(
        input_variables=["context", "question", "chat_history"],
        template=template
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        input_key="question",
        output_key="answer",
        return_messages=True
    )

    # Explicitly use the API key for the LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.7,
        google_api_key=GOOGLE_API_KEY
    )

    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": prompt},
        return_source_documents=True
    )


async def sync_document_context():
    """Sync the document context after processing files."""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(f"http://localhost:8000/api/v1/document-context/sync-from-chatbot")
    except Exception as e:
        print(f"Warning: Could not sync document context: {e}")


# Endpoints
@app.post("/upload-files/")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload and process files (PDF, TXT, PPTX)."""
    global chat_history
    try:
        result = process_files(files)
        chat_history = []  # Reset chat history on new upload

        # Sync document context after successful upload
        try:
            await sync_document_context()
        except Exception as sync_err:
            print(f"Warning: Could not sync document context: {sync_err}")

        return JSONResponse(content=result)
    except Exception as e:
        # Provide more detailed error information
        import traceback
        error_detail = f"Error processing files: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@app.post("/ask-question/")
async def ask_question(question: str = Body(..., embed=True)):
    """Ask a question about the uploaded documents."""
    global chat_history
    
    try:
        if USE_VECTOR_SEARCH:
            # Original FAISS-based implementation
            vector_db = get_vector_db()  # Get the vector_db from shared state
            if not vector_db:
                raise HTTPException(status_code=400, detail="No documents uploaded yet")

            qa_chain = initialize_qa_chain()
            response = qa_chain({"question": question})

            # Format response with sources
            answer = response["answer"]
            sources = []
            if "source_documents" in response:
                for i, doc in enumerate(response["source_documents"], 1):
                    source_info = {
                        "source": doc.metadata["source"],
                        "page_number": doc.metadata["page_number"],
                        "chunk_index": doc.metadata["chunk_index"],
                        "content": doc.page_content
                    }
                    sources.append(source_info)
        else:
            # Simplified implementation without vector search
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0.7,
                google_api_key=GOOGLE_API_KEY
            )
            
            # Get file metadata to show available files
            uploaded_files = get_uploaded_metadata()
            file_info = ""
            if uploaded_files:
                file_info = "The user has uploaded the following files:\n" + "\n".join([
                    f"- {f['filename']} ({f['page_count']} pages)" for f in uploaded_files
                ])
            else:
                file_info = "No files have been uploaded yet."
            
            # Include chat history
            conversation_context = ""
            if chat_history:
                conversation_context = "Previous conversation:\n"
                for msg in chat_history[-6:]:  # Include last 3 exchanges (6 messages)
                    role = "User" if msg["role"] == "user" else "Assistant"
                    conversation_context += f"{role}: {msg['content']}\n"
            
            # Build prompt
            prompt = f"""You are an expert research paper analyst. Answer the following question:

{question}

{file_info}

{conversation_context}

Note: Advanced document search is currently disabled. Please provide your best answer
based on the information available and general knowledge. If the question seems to require
specific information from the uploaded documents, explain that detailed document search
is temporarily unavailable.

Please provide a comprehensive response that:
1. Answers the question as best as possible with available information
2. Explains technical concepts clearly
3. Uses examples when helpful
4. Maintains academic accuracy while being accessible
"""
            
            response = llm.invoke(prompt)
            answer = response.content
            sources = []  # No sources when vector search is disabled

        # Update chat history
        chat_history.append({"role": "user", "content": question})
        chat_history.append({"role": "assistant", "content": answer})

        return JSONResponse(content={
            "answer": answer,
            "sources": sources,
            "chat_history": chat_history
        })
    except Exception as e:
        # Provide more detailed error information
        import traceback
        error_detail = f"Error processing question: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@app.get("/chat-history/")
async def get_chat_history():
    """Retrieve the current chat history."""
    return JSONResponse(content={"chat_history": chat_history})


@app.post("/reset/")
async def reset():
    """Reset the vector store and chat history."""
    global chat_history
    clear_all()
    chat_history = []

    # Also reset the document context
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8000/api/v1/document-context/clear")
    except Exception as e:
        print(f"Warning: Could not reset document context: {e}")

    return JSONResponse(content={"message": "Chatbot reset successfully"})


# Add a simple health check endpoint
@app.get("/health/")
async def health_check():
    """Check if the API is running and API key is configured."""
    return JSONResponse(content={
        "status": "healthy",
        "google_api_key_configured": bool(GOOGLE_API_KEY),
        "vector_search_enabled": USE_VECTOR_SEARCH
    })
