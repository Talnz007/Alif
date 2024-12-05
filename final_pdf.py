import os
from core.config import settings
import io
import PyPDF2
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []

class PDFGeminiChat:
    def __init__(self, api_key):
        """
        Initialize the PDFGeminiChat with Gemini API key
        
        Args:
            api_key (str): Google Generative AI API key
        """
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.pdf_text = None
        self.initial_context = """Here is the text from the pdf i am gonna ask question about this pdf from 
        you maintain the topic as intended dont include diagrams or plots and also this is the extracted text 
        from the pdf so it may lack the text in the diagrams and images to keep that in mind to fill this flaw 
        please use your own knowledge 
        here are key tasks youve todo 
        1- act like the use is chatting with the pdf 
        2- be the teacher of the user and teach him each and everything 
        4- make a one liner summary at the end of the every text 
        5- keep that in mind that your name is study buddy
        6- keep the context domain stricly dont go outside the context if someone insist to ask 
        question from domain dont answer it
        7- if user tells you to ask questions so dont give answer untill user explicitly ask about it

        
        """

    def extract_pdf_text(self, pdf_file):
        """
        Extract text from a PDF file
        
        Args:
            pdf_file (bytes): PDF file in bytes
        
        Returns:
            str: Extracted text from the PDF
        """
        try:
            # Create a file-like object from bytes
            pdf_stream = io.BytesIO(pdf_file)
            reader = PyPDF2.PdfReader(pdf_stream)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            self.pdf_text = text
            return text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error extracting PDF text: {str(e)}")

    def chat_with_gemini(self, user_message: str, conversation_history: List[dict] = None):
        """
        Chat with Gemini about the PDF content
        
        Args:
            user_message (str): User's input message
            conversation_history (List[dict], optional): Previous conversation context
        
        Returns:
            dict: Gemini's response and updated conversation history
        """
        if not self.pdf_text:
            raise HTTPException(status_code=400, detail="No PDF text available. Please upload a PDF first.")

        # Prepare conversation history
        if conversation_history is None:
            conversation_history = []

        # Limit conversation history
        if len(conversation_history) > 5:
            conversation_history = conversation_history[-5:]

        # Construct full context
        full_context = f"{self.initial_context}\n\nPDF Content:\n{self.pdf_text}"

        # Prepare conversation history for query
        history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history])

        # Construct query
        query = (f"{full_context}\n\n" + 
                 history_text + 
                 f"\n\nFollow-up Question: {user_message}")

        try:
            # Generate response
            response = self.model.generate_content(query)
            
            # Update conversation history
            new_history = conversation_history + [
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": response.text}
            ]

            return {
                "response": response.text,
                "conversation_history": new_history
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error in Gemini interaction: {str(e)}")

# Initialize FastAPI app
app = FastAPI(title="PDF Gemini Chat", description="Chat with PDF using Google Gemini")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


GOOGLE_API_KEY = settings.GEMINI_KEY  
pdf_chat = PDFGeminiChat(GOOGLE_API_KEY)

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF file for processing
    """
    # Read file contents
    pdf_bytes = await file.read()
    
    # Extract text
    pdf_text = pdf_chat.extract_pdf_text(pdf_bytes)
    
    return {
        "message": "PDF uploaded and processed successfully",
        "text_length": len(pdf_text)
    }

@app.post("/chat/")
async def chat_with_pdf(request: ChatRequest):
    """
    Chat with the uploaded PDF
    """
    # Call Gemini chat method
    result = pdf_chat.chat_with_gemini(
        request.message, 
        request.conversation_history
    )
    
    return result

# Optional: Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}