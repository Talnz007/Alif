import os
import asyncio
import logging
from typing import Optional

import fitz  # PyMuPDF
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import textwrap

from fastapi import FastAPI, File, UploadFile, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.core.config import settings




# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFAnalyzerGemini:
    def __init__(self, api_key: str):
        """
        Initialize the PDFAnalyzer with Gemini API

        Args:
            api_key (str): Your Google Gemini API key
        """
        # Configure Gemini API
        genai.configure(api_key=api_key)

        # Initialize the model
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }

        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

        # Initialize the model
        self.model = genai.GenerativeModel(
            model_name="gemini-pro",
            generation_config=generation_config,
            safety_settings=safety_settings
        )

        self.analysis_prompt = """
        Analyze the provi   ded text from the PDF and explain the key concepts clearly and concisely. 
        Please avoid repeating or regurgitating the original text. Instead, provide a simplified 
        or paraphrased explanation of the main points in a manner that is easy to understand. 
        After explaining the concepts, provide 3 reflective questions related to the material to assess understanding. 
        Keep your responses helpful but concise.

        Here's the text to analyze:
        """

    def extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """
        Extract text from a PDF file

        Args:
            pdf_path (str): Path to the PDF file

        Returns:
            Optional[str]: Extracted text from PDF or None if extraction fails
        """
        try:
            with fitz.open(pdf_path) as pdf:
                text = ""
                total_pages = len(pdf)

                for page_num in range(total_pages):
                    page = pdf[page_num]
                    text += page.get_text() + "\n"

                return text.strip()

        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return None

    def chunk_text(self, text: str, chunk_size: int = 30000) -> list[str]:
        """
        Split text into chunks to handle Gemini's token limit

        Args:
            text (str): Text to chunk
            chunk_size (int): Maximum size of each chunk

        Returns:
            list[str]: List of text chunks
        """
        return textwrap.wrap(text, chunk_size, break_long_words=False, break_on_hyphens=False)

    async def analyze_text(self, text: str) -> str:
        """
        Analyze text using the Gemini API

        Args:
            text (str): Text to analyze

        Returns:
            str: Analysis results
        """
        try:
            # Combine prompt with extracted text
            full_prompt = f"{self.analysis_prompt}\n\n{text}"

            # Initialize chat
            chat = self.model.start_chat(history=[])

            # Get response
            response = await chat.send_message_async(full_prompt)

            return response.text

        except Exception as e:
            logger.error(f"Error during text analysis: {e}")
            return f"Error: Unable to complete analysis. {str(e)}"

    async def process_long_text(self, text: str) -> str:
        """
        Process long text by breaking it into chunks

        Args:
            text (str): Long text to process

        Returns:
            str: Comprehensive analysis
        """
        chunks = self.chunk_text(text)

        if len(chunks) > 1:
            # Initialize chat for context preservation
            chat = self.model.start_chat(history=[])
            full_analysis = ""

            for i, chunk in enumerate(chunks, 1):
                prompt = f"""
                This is part {i} of {len(chunks)} of the document.
                {self.analysis_prompt}
                
                {chunk}
                
                {'Please continue your analysis.' if i > 1 else ''}
                """

                try:
                    response = await chat.send_message_async(prompt)
                    full_analysis += f"\n\n--- Analysis Part {i}/{len(chunks)} ---\n{response.text}"
                except Exception as e:
                    full_analysis += f"\n\nError processing chunk {i}: {e}"

            return full_analysis

        else:
            return await self.analyze_text(text)

    async def process_pdf(self, pdf_path: str) -> str:
        """
        Complete pipeline to process PDF and get analysis

        Args:
            pdf_path (str): Path to the PDF file

        Returns:
            str: Analysis of PDF contents
        """
        # Extract text
        text = self.extract_text_from_pdf(pdf_path)

        if text:
            # Process the text
            return await self.process_long_text(text)
        else:
            return "Failed to extract text from PDF"

# FastAPI App
app = FastAPI(title="PDF Analyzer with Gemini")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Create analyzer instance
router = APIRouter()
analyzer = PDFAnalyzerGemini(settings.GEMINI_KEY)


@router.post("/analyze-pdf/")
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Endpoint to upload and analyze PDF file

    Args:
        file (UploadFile): Uploaded PDF file

    Returns:
        dict: Analysis results
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Create temporary file to save uploaded PDF
    temp_path = f"temp_{file.filename}"

    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())

        # Process PDF
        analysis = await analyzer.process_pdf(temp_path)

        # Remove temporary file
        os.remove(temp_path)

        return {"analysis": analysis}

    except Exception as e:
        # Remove temp file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)

        raise HTTPException(status_code=500, detail=str(e))
