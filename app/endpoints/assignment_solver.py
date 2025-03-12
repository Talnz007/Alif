from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Response
from pydantic import BaseModel
from typing import Optional
from google.genai import types
from app.services.gemini_client import call_gemini
from app.core.app_logging import app_logger as logger
import fitz  # PyMuPDF for PDF text extraction
import os
import shutil
import tempfile
import docx2txt  # For docx extraction
import time
import re  # Added for filename sanitization
# Import PDF generation libraries
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO

router = APIRouter(prefix="/solver", tags=["Assignment Solver"])


# --- Models ---
class SolveTextRequest(BaseModel):
    text: str
    difficulty: Optional[str] = "medium"
    format: Optional[str] = "markdown"  # e.g., markdown, plain text
    output_format: Optional[str] = "json"  # json or pdf


class SolutionResponse(BaseModel):
    solution: str
    time_taken: str


# --- Helper Functions ---
def extract_text_from_file(file_path, file_type):
    """Extract text content from various file types."""
    doc = None
    try:
        if file_type == "application/pdf":
            doc = fitz.open(file_path)
            text = "".join([page.get_text() for page in doc])
            return text
        elif file_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                           "application/msword"]:
            text = docx2txt.process(file_path)
            return text
        elif file_type.startswith("text/"):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        else:
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {file_type}")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error extracting text from {file_path} ({file_type}): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text from file: {e}")
    finally:
        if doc:
            try:
                doc.close()
            except Exception as close_err:
                logger.error(f"Error closing PDF document {file_path}: {close_err}")


def generate_solution(text: str, difficulty: str = "medium", format: str = "markdown"):
    """Generate a solution for an assignment using Gemini AI."""
    # Build a prompt that instructs Gemini to solve the assignment
    prompt = f"""
You are an expert academic assistant. Solve the following assignment with a comprehensive approach.
Difficulty level: {difficulty}

ASSIGNMENT:
{text}

Provide a detailed solution that includes:
1. Analysis of the key requirements
2. Step-by-step approach to solving the problem
3. Complete solution with explanations
4. Citations or references where applicable

Return the solution in {format} format.
"""

    # Create a config object - using the same pattern as quiz_generator.py
    config = types.GenerateContentConfig(
        system_instruction=(
            "You are an expert academic assistant that helps students understand assignments "
            "by providing clear, structured solutions. Never encourage plagiarism, "
            "but help students understand concepts to complete their own work."
        ),
        max_output_tokens=2048,
        top_k=40,
        top_p=0.95,
        temperature=0.7,
        stop_sequences=['<END>'],
        seed=42
    )

    try:
        llm_response = call_gemini(prompt=prompt, config=config)
        logger.info("Successfully generated assignment solution")
        return llm_response
    except Exception as e:
        logger.exception(f"Error generating solution: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate solution: {str(e)}")


def generate_solution_pdf(assignment_text: str, solution_text: str, time_taken: str) -> bytes:
    """Generate a PDF document with the assignment text and solution."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Define styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.darkblue,
        spaceAfter=12
    )
    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.darkblue
    )
    normal_style = styles['Normal']
    info_style = ParagraphStyle(
        'InfoStyle',
        parent=styles['Italic'],
        fontSize=10,
        textColor=colors.gray
    )

    # Create content
    content = []

    # Title
    content.append(Paragraph("Assignment Solution", title_style))
    content.append(Spacer(1, 12))

    # Time info
    content.append(Paragraph(f"Solution generated in: {time_taken}", info_style))
    content.append(Spacer(1, 12))

    # Assignment section
    content.append(Paragraph("Original Assignment", heading_style))
    content.append(Spacer(1, 8))

    # Split assignment text into paragraphs and add them
    for para in assignment_text.strip().split('\n'):
        if para.strip():
            content.append(Paragraph(para, normal_style))
            content.append(Spacer(1, 6))

    content.append(Spacer(1, 12))
    content.append(PageBreak())

    # Solution section
    content.append(Paragraph("Solution", heading_style))
    content.append(Spacer(1, 8))

    # Parse markdown-like formatting in the solution
    solution_paras = solution_text.strip().split('\n')
    for para in solution_paras:
        if not para.strip():
            continue

        # Handle markdown headings
        if para.startswith('# '):
            content.append(Paragraph(para[2:], heading_style))
        elif para.startswith('## '):
            sub_heading = ParagraphStyle(
                'SubHeading',
                parent=styles['Heading3'],
                fontSize=12,
                textColor=colors.darkblue
            )
            content.append(Paragraph(para[3:], sub_heading))
        elif para.startswith('### '):
            sub_sub_heading = ParagraphStyle(
                'SubSubHeading',
                parent=styles['Heading4'],
                fontSize=11,
                textColor=colors.darkblue
            )
            content.append(Paragraph(para[4:], sub_sub_heading))
        # Handle bullet points
        elif para.strip().startswith('* ') or para.strip().startswith('- '):
            content.append(Paragraph("• " + para.strip()[2:], normal_style))
        # Handle numbered lists
        elif re.match(r'^\d+\.', para.strip()):
            content.append(Paragraph(para, normal_style))
        # Regular paragraph
        else:
            content.append(Paragraph(para, normal_style))

        content.append(Spacer(1, 6))

    # Footer
    content.append(Spacer(1, 20))
    content.append(Paragraph("Generated by Alif Tutoring Assistant", info_style))

    # Build PDF
    try:
        doc.build(content)
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


# --- Endpoints ---
@router.post("/text", response_model=SolutionResponse,
             responses={200: {"content": {"application/json": {}, "application/pdf": {}}}})
def solve_assignment_text(request: SolveTextRequest):
    """Generate a solution for an assignment from text input."""
    start_time = time.time()
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Assignment text cannot be empty")

        # Generate solution text
        solution = generate_solution(request.text, request.difficulty, request.format)

        # Calculate time taken
        end_time = time.time()
        time_taken = f"{end_time - start_time:.2f} seconds"

        # If PDF output is requested, return the PDF response
        if request.output_format == "pdf":
            try:
                pdf_data = generate_solution_pdf(request.text, solution, time_taken)
                safe_filename = re.sub(r'[^\w\-.]', '_', request.text[:20])
                return Response(
                    content=pdf_data,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f"attachment; filename=assignment-solution-{safe_filename}.pdf"
                    }
                )
            except Exception as pdf_err:
                logger.error(f"PDF generation failed: {pdf_err}")
                # Fall back to JSON if PDF generation fails
                return SolutionResponse(solution=solution, time_taken=time_taken)

        # Default to JSON response
        return SolutionResponse(solution=solution, time_taken=time_taken)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Error in solve_assignment_text endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/upload", response_model=SolutionResponse,
             responses={200: {"content": {"application/json": {}, "application/pdf": {}}}})
async def solve_assignment_upload(
        file: UploadFile = File(...),
        difficulty: str = Form("medium"),
        format: str = Form("markdown"),
        output_format: str = Form("json")
):
    """Generate a solution for an assignment from an uploaded file."""
    start_time = time.time()

    with tempfile.TemporaryDirectory() as temp_dir:
        safe_filename = re.sub(r'[^\w\-.]', '_', os.path.basename(file.filename or "uploaded_file"))
        file_path = os.path.join(temp_dir, safe_filename)

        try:
            # Save uploaded file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Extract text based on file content type
            text = extract_text_from_file(file_path, file.content_type)

            if not text or not text.strip():
                raise HTTPException(status_code=422, detail="Could not extract meaningful text from the file")

            # Generate solution
            solution = generate_solution(text, difficulty, format)

            # Calculate time taken
            end_time = time.time()
            time_taken = f"{end_time - start_time:.2f} seconds"

            # If PDF output is requested, return the PDF response
            if output_format == "pdf":
                try:
                    pdf_data = generate_solution_pdf(text, solution, time_taken)
                    return Response(
                        content=pdf_data,
                        media_type="application/pdf",
                        headers={
                            "Content-Disposition": f"attachment; filename=assignment-solution-{safe_filename}.pdf"
                        }
                    )
                except Exception as pdf_err:
                    logger.error(f"PDF generation failed: {pdf_err}")
                    # Fall back to JSON if PDF generation fails
                    return SolutionResponse(solution=solution, time_taken=time_taken)

            # Default to JSON response
            return SolutionResponse(solution=solution, time_taken=time_taken)

        except HTTPException as e:
            logger.error(f"HTTPException processing upload {file.filename}: {e.detail}")
            raise e
        except Exception as e:
            logger.exception(f"Error in solve_assignment_upload for {file.filename}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")