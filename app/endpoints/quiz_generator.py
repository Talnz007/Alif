from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional
from google.genai import types
from app.services.gemini_client import call_gemini
from app.core.app_logging import app_logger as logger
import re
import json
import fitz  # PyMuPDF for PDF text extraction
import os
import shutil
from json_repair import repair_json

router = APIRouter(prefix="/quiz", tags=["Quiz Generator"])


class QuizRequest(BaseModel):
    text: str
    num_questions: int = 5
    difficulty: Optional[str] = "medium"


class Question(BaseModel):
    question_type: str  # "multiple_choice", "true_false", "short_answer"
    question: str
    options: Optional[List[str]] = None
    answer: str


class QuizResponse(BaseModel):
    quiz: List[Question]


def extract_text_from_pdf(pdf_path):
    """Extract text content from a PDF file."""
    doc = fitz.open(pdf_path)
    text = "\n".join([page.get_text() for page in doc])
    return text


def generate_quiz_questions(text: str, num_questions: int = 5, difficulty: str = "medium"):
    """Generate quiz questions from text using Gemini."""
    # Build a refined prompt
    prompt = f"""
You are an expert educator. Generate {num_questions} quiz questions.
Difficulty: {difficulty}. Provide question types: multiple_choice, true_false, short_answer.

STRICTLY return a JSON array. Each object should have:
- "question_type" (string): "multiple_choice", "true_false", or "short_answer"
- "question" (string): The quiz question
- "options" (list of strings, only if multiple_choice)
- "answer" (string)

Example Output:
[
  {{"question_type": "multiple_choice", "question": "What is 2+2?", "options": ["3", "4", "5"], "answer": "4"}},
  {{"question_type": "true_false", "question": "The sky is blue.", "answer": "true"}}
]

Text: {text}
"""

    # Create a config object
    config = types.GenerateContentConfig(
        system_instruction="Return ONLY valid JSON. No extra text. No explanations. No markdown.",
        max_output_tokens=800,
        top_k=2,
        top_p=0.5,
        temperature=0.5,
        response_mime_type='application/json',
        stop_sequences=['```'],
        seed=42
    )

    # Call Gemini
    try:
        llm_response = call_gemini(prompt=prompt, config=config)
        logger.info(f"Raw Gemini response (Quiz): {llm_response}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    # Extract JSON (Handle Code Fences)
    cleaned_output = llm_response.strip()
    cleaned_output = re.sub(r'```json|```', '', cleaned_output)  # Remove markdown code fences
    cleaned_output = cleaned_output.replace('\n', ' ')  # Remove newlines

    # Attempt JSON parsing with repair fallback
    try:
        questions_data = json.loads(cleaned_output)
    except json.JSONDecodeError:
        try:
            fixed_json = repair_json(cleaned_output)  # Fix broken JSON
            questions_data = json.loads(fixed_json)
            logger.info("Successfully repaired broken JSON.")
        except Exception as parse_error:
            logger.error(f"JSON repair failed: {parse_error}. Using fallback questions.")
            questions_data = [
                {
                    "question_type": "multiple_choice",
                    "question": "Which planet is known as the Red Planet?",
                    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
                    "answer": "Mars"
                },
                {
                    "question_type": "true_false",
                    "question": "The speed of light is approximately 3 x 10^8 m/s.",
                    "answer": "True"
                },
                {
                    "question_type": "short_answer",
                    "question": "Name the process by which plants convert sunlight into chemical energy.",
                    "answer": "Photosynthesis"
                }
            ]

    return questions_data


@router.post("/generate", response_model=QuizResponse)
def generate_quiz(request: QuizRequest):
    """Generate quiz questions using text input."""
    try:
        questions_data = generate_quiz_questions(request.text, request.num_questions, request.difficulty)

        # Convert to Pydantic models
        quiz_questions = [Question(**q) for q in questions_data]

        return QuizResponse(quiz=quiz_questions)
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")


@router.post("/upload-pdf", response_model=QuizResponse)
async def upload_pdf_for_quiz(file: UploadFile = File(...), num_questions: int = 5, difficulty: str = "medium"):
    """Upload PDF and generate quiz questions from its content."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Create temp directory if it doesn't exist
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{file.filename}"

    try:
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text from PDF
        text = extract_text_from_pdf(file_path)

        # Generate quiz questions
        questions_data = generate_quiz_questions(text, num_questions, difficulty)

        # Convert to Pydantic models
        quiz_questions = [Question(**q) for q in questions_data]

        return QuizResponse(quiz=quiz_questions)
    except Exception as e:
        logger.error(f"Error processing PDF for quiz: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        # Clean up the file
        if os.path.exists(file_path):
            os.remove(file_path)