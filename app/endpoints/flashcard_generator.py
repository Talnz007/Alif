from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import fitz  # PyMuPDF for PDF text extraction
from google.genai import types  # Correct import pattern that works
import shutil
import os
import re
import json
from app.core.app_logging import app_logger as logger
from app.services.gemini_client import call_gemini
from json_repair import repair_json

# Initialize router
router = APIRouter(prefix="/flashcards", tags=["Flashcard Generator"])


# --- Models ---
class FlashcardRequest(BaseModel):
    text: str
    num_flashcards: int = 5


class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]


# --- Helper Functions ---
def extract_text_from_pdf(pdf_path):
    """Extract text content from a PDF file."""
    doc = None
    try:
        doc = fitz.open(pdf_path)
        text = "\n".join([page.get_text() for page in doc])
        return text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {pdf_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read PDF content: {e}")
    finally:
        if doc:
            try:
                doc.close()
            except Exception as close_err:
                logger.error(f"Error closing PDF document {pdf_path}: {close_err}")


def process_gemini_response(response_text: str) -> List[Dict[str, str]]:
    """Process the Gemini response to extract flashcards."""
    try:
        # Clean up potential code fences
        cleaned_output = (
            response_text
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        # Validate the JSON and parse it
        flashcards_data = json.loads(cleaned_output)

        # Handle both array and single object responses
        if not isinstance(flashcards_data, list):
            flashcards_data = [flashcards_data]

        # Standardize the keys
        standardized_data = []
        for card in flashcards_data:
            standardized_card = {
                "front": card.get("front") or card.get("question") or card.get("term") or "Unknown question",
                "back": card.get("back") or card.get("answer") or card.get("definition") or "Unknown answer"
            }
            standardized_data.append(standardized_card)

        return standardized_data
    except json.JSONDecodeError:
        try:
            # Use json_repair as fallback
            fixed_json = repair_json(response_text.strip())
            flashcards_data = json.loads(fixed_json)

            # Apply the same standardization
            if not isinstance(flashcards_data, list):
                flashcards_data = [flashcards_data]

            standardized_data = []
            for card in flashcards_data:
                standardized_card = {
                    "front": card.get("front") or card.get("question") or card.get("term") or "Unknown question",
                    "back": card.get("back") or card.get("answer") or card.get("definition") or "Unknown answer"
                }
                standardized_data.append(standardized_card)

            logger.info("Successfully repaired flashcard JSON.")
            return standardized_data
        except Exception as repair_err:
            logger.error(f"Flashcard JSON repair failed: {repair_err}")
            return [{"front": "Error", "back": f"Failed to parse AI response: {repair_err}"}]
    except Exception as e:
        logger.error(f"Error processing Gemini response: {e}")
        return [{"front": "Error processing response", "back": "Please try again"}]


def generate_flashcards_with_gemini(text: str, num_flashcards: int = 5) -> List[Dict[str, str]]:
    """Generate flashcards using Gemini."""
    # Create the prompt with proper formatting
    prompt = f"""
Generate {num_flashcards} flashcards based on the text below.
Each flashcard should be a JSON object with "front" and "back".
Return the output strictly as a JSON array, no extra text or code fences.

Text: {text}
"""

    # Create a config object - using the same pattern as quiz_generator.py
    config = types.GenerateContentConfig(
        system_instruction="Return only valid JSON for flashcards. No code fences.",
        max_output_tokens=800,
        top_k=2,
        top_p=0.5,
        temperature=0.5,
        response_mime_type='application/json',
        stop_sequences=['```'],
        seed=42
    )

    # Call Gemini - using the simplified pattern from working code
    try:
        llm_response = call_gemini(prompt=prompt, config=config)
        logger.info(f"Raw Gemini response (Flashcards): {llm_response}")
        return process_gemini_response(llm_response)
    except Exception as e:
        logger.error(f"Error calling Gemini for flashcards: {e}")
        return [{"front": "API Error", "back": f"Failed to generate flashcards: {str(e)}"}]


# --- Endpoints ---
@router.post("/generate", response_model=FlashcardResponse)
def generate_flashcards_from_text(request: FlashcardRequest):
    """Generate flashcards from text input."""
    try:
        flashcards_data = generate_flashcards_with_gemini(request.text, request.num_flashcards)
        flashcards = [Flashcard(**fc) for fc in flashcards_data]
        return FlashcardResponse(flashcards=flashcards)
    except Exception as e:
        logger.error(f"Error in /generate flashcards endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process flashcard request: {e}")


@router.post("/upload-pdf", response_model=FlashcardResponse)
async def upload_pdf_for_flashcards(file: UploadFile = File(...)):
    """Upload PDF and generate flashcards from its content."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Create temp directory if it doesn't exist
    os.makedirs("temp", exist_ok=True)
    safe_filename = re.sub(r'[^\w\-.]', '_', os.path.basename(file.filename))
    file_path = os.path.join("temp", safe_filename)

    try:
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text from PDF
        text = extract_text_from_pdf(file_path)
        if not text or not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text content from PDF.")

        # Generate flashcards
        flashcards_data = generate_flashcards_with_gemini(text)
        flashcards = [Flashcard(**fc) for fc in flashcards_data]

        return FlashcardResponse(flashcards=flashcards)
    except HTTPException as e:
        logger.error(f"HTTPException processing PDF for flashcards {file.filename}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error processing PDF for flashcards {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        # Clean up the file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as cleanup_err:
                logger.error(f"Failed to remove temp PDF file {file_path}: {cleanup_err}")