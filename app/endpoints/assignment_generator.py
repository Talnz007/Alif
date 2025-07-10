from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
from typing import List, Optional
from google.genai import types  # Correct import pattern that works
from app.services.gemini_client import call_gemini
from app.core.app_logging import app_logger as logger
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
import re  # Added for filename sanitization
from app.endpoints.auth import log_user_activity

router = APIRouter(prefix="/assignment", tags=["Assignment Generator"])

# --- Models ---
class AssignmentRequest(BaseModel):
    text: str
    assignment_type: str = "essay"
    num_tasks: int = 3
    difficulty: Optional[str] = "medium"
    output_format: Optional[str] = "json"

class Task(BaseModel):
    title: str
    description: str
    reference: Optional[str] = None
    solution: Optional[str] = None

class AssignmentResponse(BaseModel):
    assignment_type: str
    tasks: List[Task]

# --- PDF Generation ---
def generate_pdf(assignment_type, topic, tasks):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=18, textColor=colors.darkblue, spaceAfter=12)
    heading_style = ParagraphStyle('HeadingStyle', parent=styles['Heading2'], fontSize=14, textColor=colors.darkblue)
    normal_style = styles['Normal']
    content = []
    content.append(Paragraph(f"{assignment_type.title()} Assignment: {topic}", title_style))
    content.append(Spacer(1, 12))
    for i, task in enumerate(tasks, 1):
        content.append(Paragraph(f"Task {i}: {task.title}", heading_style))
        content.append(Spacer(1, 8))
        description_paragraphs = task.description.strip().split('\n')
        for p in description_paragraphs:
            if p.strip():
                content.append(Paragraph(p, normal_style))
                content.append(Spacer(1, 6))
        if task.reference:
            content.append(Paragraph(f"<b>Reference:</b> {task.reference}", normal_style))
            content.append(Spacer(1, 8))
        if task.solution:
            content.append(Paragraph("<b>Solution:</b>", normal_style))
            solution_paragraphs = task.solution.strip().split('\n')
            for p in solution_paragraphs:
                if p.strip():
                    content.append(Paragraph(p, normal_style))
                    content.append(Spacer(1, 6))
        content.append(Spacer(1, 12))
    try:
        doc.build(content)
        buffer.seek(0)
        return buffer
    except Exception as pdf_build_err:
        logger.error(f"Error building PDF content: {pdf_build_err}")
        raise pdf_build_err

# --- Endpoint ---
@router.post("/generate", response_model=AssignmentResponse, responses={200: {"content": {"application/json": {}, "application/pdf": {}}}})
async def generate_assignment(request: AssignmentRequest, fastapi_request: Request):
    """
    Generate a structured assignment using Google Gemini.
    Can return JSON or PDF based on output_format.
    """
    topic = request.text.strip().split('\n')[0][:50]
    if len(topic) < 10:
        topic = request.text[:50].strip() + "..."

    prompt = f"""
Create a structured {request.assignment_type} assignment with {request.num_tasks} tasks at {request.difficulty} difficulty level based on the text below.
For each task, return an object with the keys: "title", "description", "reference", and "solution".
Return the output strictly as a JSON array with no extra text or code fences.

Text: {request.text}
"""

    config = types.GenerateContentConfig(
        system_instruction=(
            "You are an expert educator. Return only valid JSON (no triple backticks). "
            "The user wants a JSON array describing tasks for an assignment."
        ),
        max_output_tokens=800,
        top_k=2,
        top_p=0.5,
        temperature=0.5,
        response_mime_type='application/json',
        stop_sequences=['```'],
        seed=42
    )

    try:
        llm_response = call_gemini(prompt=prompt, config=config)
        logger.info(f"Raw Gemini response (Assignment): {llm_response}")
    except Exception as e:
        logger.exception(f"Error calling Gemini for assignment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate assignment data: {str(e)}")

    cleaned_output = (
        llm_response
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    try:
        tasks_data = json.loads(cleaned_output)
    except json.JSONDecodeError as parse_error:
        logger.error(f"JSON parsing failed for assignment: {parse_error}. Using fallback data.")
        tasks_data = []
        for i in range(request.num_tasks):
            tasks_data.append({
                "title": f"Task {i + 1}",
                "description": "Discuss the main points from the text.",
                "reference": "Refer to Chapter 2 for details.",
                "solution": "Review the provided text to craft a summary."
            })

    if not isinstance(tasks_data, list):
        tasks_data = [tasks_data] if tasks_data else []

    try:
        tasks = [Task(**t) for t in tasks_data]
    except Exception as model_error:
        logger.error(f"Error converting assignment data to models: {model_error}")
        tasks = []
        for i, t_data in enumerate(tasks_data):
            try:
                tasks.append(Task(**t_data))
            except:
                tasks.append(Task(
                    title=f"Invalid Task {i+1}",
                    description=f"Error processing task data: {str(model_error)}",
                    reference="N/A",
                    solution="N/A"
                ))

    # --- ACTIVITY LOGGING ---
    user_id = fastapi_request.headers.get("x-user-id")
    if user_id:
        try:
            await log_user_activity(
                user_id,
                "assignment_generated",
                {
                    "assignment_type": request.assignment_type,
                    "num_tasks": len(tasks),
                    "topic": topic,
                    "source": "generator"
                }
            )
        except Exception as log_error:
            logger.error(f"Failed to log assignment generation activity: {log_error}")

    # PDF/JSON logic unchanged
    if request.output_format == "pdf":
        try:
            pdf_buffer = generate_pdf(request.assignment_type, topic, tasks)
            safe_topic = re.sub(r'[^\w\-.]', '_', topic[:20])
            return Response(
                content=pdf_buffer.getvalue(),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=assignment_{safe_topic}.pdf"}
            )
        except Exception as pdf_error:
            logger.exception(f"Error generating PDF: {pdf_error}")
            logger.info("Falling back to JSON response due to PDF generation error")

    return AssignmentResponse(
        assignment_type=request.assignment_type,
        tasks=tasks
    )