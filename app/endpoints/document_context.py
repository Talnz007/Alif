from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import time
from app.core.app_logging import app_logger
import traceback

# Import vector_db from chatbot with proper relative import
from app.core.shared_state import get_vector_db, get_uploaded_metadata

uploaded_file_metadata = []  # This will be populated from chatbot.py

router = APIRouter(prefix="/document-context", tags=["Document Context"])


# Models
class FileInfo(BaseModel):
    id: str
    name: str
    type: str
    size: int = 0
    page_count: int = 1
    created_at: float
    active: bool = True


class KnowledgeBaseInfo(BaseModel):
    id: str
    name: str
    description: str
    document_count: int
    connected: bool = False


# In-memory storage (replace with database in production)
active_files: Dict[str, FileInfo] = {}
knowledge_bases: Dict[str, KnowledgeBaseInfo] = {}


# Helper function to create test data (for debugging only)
def create_test_data():
    """Create some test data to verify UI integration."""
    global active_files, knowledge_bases
    app_logger.info("Creating test data for document context...")

    # Create a sample file
    file_id = f"test_file_{int(time.time())}"
    active_files[file_id] = FileInfo(
        id=file_id,
        name="sample_document.pdf",
        type="pdf",
        size=1024 * 1024,  # 1MB
        page_count=5,
        created_at=time.time()
    )

    # Create a sample knowledge base
    kb_id = "test_kb"
    knowledge_bases[kb_id] = KnowledgeBaseInfo(
        id=kb_id,
        name="Test Knowledge Base",
        description="This is a test knowledge base",
        document_count=1,
        connected=True
    )

    app_logger.info(f"Created test file: {file_id} and test KB: {kb_id}")


# Endpoints
@router.get("/active-files", response_model=List[FileInfo])
async def get_active_files():
    """Get all currently active files in the context."""
    app_logger.info(f"GET /active-files called - Current count: {len(active_files)}")

    if not active_files:
        # If no active files tracked but vector DB exists, retrieve files from there
        vector_db = get_vector_db()  # Get from shared state
        app_logger.info(f"No active files, checking vector_db. Vector DB exists: {vector_db is not None}")
        try:
            await sync_from_chatbot_internal()
            app_logger.info(f"After sync, active files count: {len(active_files)}")
        except Exception as e:
            app_logger.error(f"Error automatically syncing from vector DB: {str(e)}")
            app_logger.error(traceback.format_exc())

    result = list(active_files.values())
    app_logger.info(f"Returning {len(result)} active files")
    return result


@router.post("/active-files", response_model=FileInfo)
async def add_active_file(file: FileInfo):
    """Add a file to the active context."""
    active_files[file.id] = file
    return file


@router.delete("/active-files/{file_id}")
async def remove_active_file(file_id: str):
    """Remove a file from the active context."""
    if file_id in active_files:
        del active_files[file_id]
        return JSONResponse(content={"message": f"File {file_id} removed from context"})
    raise HTTPException(status_code=404, detail="File not found")


@router.post("/clear")
async def clear_document_context():
    """Clear all document context data."""
    global active_files, knowledge_bases
    app_logger.info("Clearing document context data")

    active_files.clear()
    knowledge_bases.clear()

    return JSONResponse(content={"message": "Document context cleared"})


@router.get("/knowledge-bases", response_model=List[KnowledgeBaseInfo])
async def get_knowledge_bases():
    """Get all available knowledge bases."""
    app_logger.info(f"GET /knowledge-bases called - Current count: {len(knowledge_bases)}")

    # If no knowledge bases but vector DB exists, create a default entry
    vector_db = get_vector_db()  # Get from shared state
    if not knowledge_bases and vector_db is not None:
        try:
            app_logger.info("Creating default knowledge base from vector DB")
            kb_id = "default-kb"
            knowledge_bases[kb_id] = KnowledgeBaseInfo(
                id=kb_id,
                name="Document Vector Store",
                description="FAISS vector store with uploaded documents",
                document_count=len(active_files),
                connected=True
            )
        except Exception as e:
            app_logger.error(f"Error creating default knowledge base: {str(e)}")

    result = list(knowledge_bases.values())
    app_logger.info(f"Returning {len(result)} knowledge bases")
    return result


async def sync_from_chatbot_internal():
    """Internal function to synchronize document context from chatbot state."""
    global active_files, knowledge_bases

    # Clear existing files first
    active_files.clear()

    # Get current vector_db and metadata from shared state
    vector_db = get_vector_db()
    uploaded_file_metadata = get_uploaded_metadata()

    app_logger.info(f"Vector DB exists: {vector_db is not None}")
    app_logger.info(f"Fallback metadata available: {len(uploaded_file_metadata)}")

    # First try to get data from vector_db if it exists
    if vector_db is not None:
        app_logger.info("Using vector_db for document context")
        sources = set()
        page_counts = {}

        try:
            # Access the docstore dictionary to extract metadata
            if hasattr(vector_db, 'docstore') and hasattr(vector_db.docstore, '_dict'):
                docstore_dict = vector_db.docstore._dict
                app_logger.info(f"Vector DB docstore dict size: {len(docstore_dict)}")

                # Debug: Print all metadata in vector DB
                for doc_id, doc in docstore_dict.items():
                    if hasattr(doc, 'metadata'):
                        if 'source' in doc.metadata:
                            source = doc.metadata['source']
                            sources.add(source)
                            app_logger.info(f"Found source in vector DB: {source}")

                            # Count pages
                            if source not in page_counts:
                                page_counts[source] = set()
                            if 'page_number' in doc.metadata:
                                page_counts[source].add(doc.metadata['page_number'])
            else:
                app_logger.warning(f"Vector DB doesn't have expected docstore structure")

            # Create file entries from vector DB
            timestamp_base = int(time.time())
            for i, source in enumerate(sources):
                file_id = f"file_{timestamp_base}_{i}"
                file_type = source.split('.')[-1].lower() if '.' in source else 'unknown'

                active_files[file_id] = FileInfo(
                    id=file_id,
                    name=source,
                    type=file_type,
                    size=0,
                    page_count=max(1, len(page_counts.get(source, {0}))),
                    created_at=time.time()
                )
                app_logger.info(f"Added file from vector DB: {source}")

            # Create knowledge base entry
            if sources:
                kb_id = "default-kb"
                knowledge_bases[kb_id] = KnowledgeBaseInfo(
                    id=kb_id,
                    name="Document Vector Store",
                    description="FAISS vector store with uploaded documents",
                    document_count=len(sources),
                    connected=True
                )
                app_logger.info(f"Created knowledge base entry from vector DB")

        except Exception as e:
            app_logger.error(f"Error accessing vector db documents: {e}")
            app_logger.error(traceback.format_exc())

    # If no files in context yet but we have fallback metadata, use that
    if not active_files and uploaded_file_metadata:
        app_logger.info(f"Using fallback metadata for {len(uploaded_file_metadata)} files")

        timestamp_base = int(time.time())
        for i, file_meta in enumerate(uploaded_file_metadata):
            file_id = f"file_{timestamp_base}_{i}"
            filename = file_meta["filename"]
            file_type = filename.split('.')[-1].lower() if '.' in filename else 'unknown'

            active_files[file_id] = FileInfo(
                id=file_id,
                name=filename,
                type=file_type,
                size=file_meta.get("file_size", 0),
                page_count=file_meta.get("page_count", 1),
                created_at=time.time()
            )
            app_logger.info(f"Added file from fallback metadata: {filename}")

        # Create a fallback knowledge base
        if uploaded_file_metadata:
            kb_id = "fallback-kb"
            knowledge_bases[kb_id] = KnowledgeBaseInfo(
                id=kb_id,
                name="Document Storage",
                description="Files are stored but search capabilities may be limited",
                document_count=len(uploaded_file_metadata),
                connected=True
            )
            app_logger.info(f"Created knowledge base entry from fallback metadata")

    app_logger.info(
        f"Final file entries: {len(active_files)} with names: {[file.name for file in active_files.values()]}")


@router.post("/sync-from-chatbot")
async def sync_from_chatbot():
    """API endpoint to synchronize document context from chatbot state."""
    global active_files, knowledge_bases

    app_logger.info("POST /sync-from-chatbot called")
    vector_db = get_vector_db()  # Get from shared state
    app_logger.info(f"Vector DB exists: {vector_db is not None}")

    if vector_db is None:
        return JSONResponse(content={"message": "No documents in chatbot to sync"})

    # Clear existing data
    active_files.clear()
    knowledge_bases.clear()

    await sync_from_chatbot_internal()

    return JSONResponse(content={
        "files_synced": len(active_files),
        "knowledge_bases_synced": len(knowledge_bases)
    })


# Add an endpoint to force test data creation (for debugging)
@router.post("/create-test-data")
async def create_debug_test_data():
    """Create test data for debugging purposes."""
    create_test_data()
    return JSONResponse(content={
        "files_created": len(active_files),
        "knowledge_bases_created": len(knowledge_bases)
    })


@router.get("/debug-vector-db")
async def debug_vector_db():
    """Debug endpoint to check vector DB content."""
    vector_db = get_vector_db()
    if vector_db is None:
        return JSONResponse(content={"status": "No vector DB found"})

    try:
        files_found = set()
        doc_count = 0
        if hasattr(vector_db, 'docstore') and hasattr(vector_db.docstore, '_dict'):
            doc_count = len(vector_db.docstore._dict)
            for doc_id, doc in vector_db.docstore._dict.items():
                if hasattr(doc, 'metadata') and 'source' in doc.metadata:
                    files_found.add(doc.metadata['source'])

        return JSONResponse(content={
            "status": "Vector DB found",
            "document_count": doc_count,
            "files_found": list(files_found)
        })
    except Exception as e:
        return JSONResponse(content={"status": f"Error inspecting vector DB: {str(e)}"})


@router.get("/debug-fallback")
async def debug_fallback_metadata():
    """Debug endpoint to check fallback metadata."""
    uploaded_file_metadata = get_uploaded_metadata()
    return JSONResponse(content={
        "status": "Fallback metadata check",
        "file_count": len(uploaded_file_metadata),
        "files": uploaded_file_metadata
    })