import os
import logging
from typing import Optional

import fitz  # PyMuPDF
import google.generativeai as genai
# Import the correct config type if needed, and other types
from google.generativeai.types import HarmCategory, HarmBlockThreshold, GenerationConfig
import textwrap

from fastapi import File, UploadFile, HTTPException, APIRouter
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFAnalyzerGemini:
    def __init__(self, api_key: str): # api_key argument is passed from instantiation
        logger.info("Initializing PDFAnalyzerGemini (assuming genai is configured).")

        # --- DEFINE AND ASSIGN CONFIGS *BEFORE* USE ---
        self.generation_config = { # Assign to self.
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        self.safety_settings = { # Assign to self.
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        # --- END DEFINITION ---

        # Removed genai.configure(...)

        model_name = getattr(settings, "GEMINI_MODEL_NAME", "gemini-pro")
        # Initialize the model instance safely
        try:
            # Now self.generation_config and self.safety_settings exist
            self.model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=self.generation_config, # Use self.
                safety_settings=self.safety_settings     # Use self.
            )
            logger.info(f"PDFAnalyzerGemini initialized model '{model_name}'.")
        except Exception as model_init_err:
            logger.exception(
                f"CRITICAL: Failed to initialize GenerativeModel '{model_name}' in PDFAnalyzerGemini: {model_init_err}")
            self.model = None

        self.analysis_prompt = """
        Analyze the provided text from the PDF and explain the key concepts clearly and concisely.
        Please avoid repeating or regurgitating the original text. Instead, provide a simplified
        or paraphrased explanation of the main points in a manner that is easy to understand.
        After explaining the concepts, provide 3 reflective questions related to the material to assess understanding.
        Keep your responses helpful but concise.

        Here's the text to analyze:
        """

    def extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """
        Extract text from a PDF file
        """
        try:
            with fitz.open(pdf_path) as pdf:
                text = ""
                for page_num in range(len(pdf)):
                    page = pdf[page_num]
                    text += page.get_text() + "\n"
                return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF {pdf_path}: {e}")
            return None # Return None on failure

    def chunk_text(self, text: str, chunk_size: int = 30000) -> list[str]:
        """
        Split text into chunks
        """
        return textwrap.wrap(text, chunk_size, break_long_words=False, break_on_hyphens=False)

    async def analyze_text(self, text: str) -> str:
        """
        Analyze text using the Gemini API
        """
        if not self.model:
            logger.error("PDFAnalyzerGemini model was not initialized successfully during startup.")
            return "Error: PDF analysis service model is not available."

        try:
            full_prompt = f"{self.analysis_prompt}\n\n{text}"
            chat = self.model.start_chat(history=[])
            response = await chat.send_message_async(full_prompt)
            return response.text
        except Exception as e:
            logger.exception(f"Error during PDF text analysis API call: {e}") # Log full trace
            return f"Error: Unable to complete analysis due to API communication failure." # More specific error

    async def process_long_text(self, text: str) -> str:
        """
        Process long text by breaking it into chunks
        """
        chunks = self.chunk_text(text)

        if len(chunks) > 1:
            # Check model before starting chat
            if not self.model:
                 logger.error("PDFAnalyzerGemini model was not initialized successfully.")
                 return "Error: PDF analysis service model is not available."

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
                    logger.exception(f"Error processing PDF analysis chunk {i}: {e}") # Log full trace
                    full_analysis += f"\n\nError processing chunk {i}: Communication failure."
                    # Optionally break or continue processing other chunks
            return full_analysis
        elif text: # Handle case where there's only one chunk (and text is not empty)
            return await self.analyze_text(text) # This now includes the model check
        else:
            return "Error: No text provided for analysis."

    async def process_pdf(self, pdf_path: str) -> str:
        """
        Complete pipeline to process PDF and get analysis
        """
        text = self.extract_text_from_pdf(pdf_path)
        if text:
            return await self.process_long_text(text)
        else:
            # Make error message consistent
            return "Error: Failed to extract text from PDF"

# --- Router and Endpoint ---
router = APIRouter()
# Pass the key, as __init__ expects it (even if redundant due to global config)
analyzer = PDFAnalyzerGemini(settings.GEMINI_KEY)

@router.post("/analyze-pdf/")
async def analyze_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Use a more robust temp file name if needed, but this is okay for basic use
    temp_path = f"temp_{file.filename}"
    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            # Use await file.read() for async context
            content = await file.read()
            buffer.write(content)

        # Process PDF using the analyzer instance
        analysis_result = await analyzer.process_pdf(temp_path)

        # Check for error strings returned by the analyzer methods
        if analysis_result.startswith("Error:"):
            if "model is not available" in analysis_result:
                 status_code = 503 # Service Unavailable
            elif "Failed to extract text" in analysis_result:
                 status_code = 422 # Unprocessable Entity (can't read file)
            else:
                 status_code = 500 # Internal Server Error (e.g., API comms failed)
            # Log the specific error before raising
            logger.error(f"PDF analysis failed for {file.filename}: {analysis_result} (Status: {status_code})")
            raise HTTPException(status_code=status_code, detail=analysis_result)

        # If no error string, return success
        return {"analysis": analysis_result}

    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (like the 400 for non-PDF)
        raise http_exc
    except Exception as e:
        # Catch unexpected errors during file handling etc.
        logger.exception(f"Unexpected error in /analyze-pdf/ endpoint for {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred while processing the PDF.")
    finally:
        # Ensure temporary file is always cleaned up
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as cleanup_err:
                logger.error(f"Failed to remove temporary file {temp_path}: {cleanup_err}")