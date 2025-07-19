from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from app.database.connection import supabase_db
from app.services.gemini_client import call_gemini
from datetime import datetime, timedelta
import json
import re

router = APIRouter(prefix="/personal_recommendations", tags=["Recommendations"])

class RecommendationsRequest(BaseModel):
    user_id: str
    days: Optional[int] = 14  # Last N days to consider

class RecommendationsResponse(BaseModel):
    suggestions: List[str]

def summarize_activity_logs(logs: List[dict]) -> str:
    """
    Summarize logs into a readable string for Gemini prompt.
    Example: "2025-07-08: quiz_completed (score: 80, correct: 4/5)\n2025-07-09: assignment_completed (score: 90)"
    """
    summary_lines = []
    for log in logs:
        date = log['timestamp'].split('T')[0]
        activity = log['activity_type']
        meta = log.get('metadata') or {}

        # Custom summary for quiz_completed
        if activity == "quiz_completed":
            score = meta.get('score')
            correct = meta.get('correct_answers')
            total = meta.get('total_questions')
            summary_lines.append(f"{date}: quiz_completed (score: {score}, correct: {correct}/{total})")
        # Custom summary for assignments
        elif activity == "assignment_completed":
            score = meta.get('score')
            summary_lines.append(f"{date}: assignment_completed (score: {score})")
        # Other types (login, registration, uploads, etc.)
        elif activity == "user_login":
            summary_lines.append(f"{date}: user_login")
        elif activity == "flashcards_generated":
            num = meta.get('num_flashcards')
            summary_lines.append(f"{date}: flashcards_generated ({num} flashcards)")
        elif activity == "document_uploaded":
            filename = meta.get('filename')
            summary_lines.append(f"{date}: document_uploaded ({filename})")
        elif activity == "audio_uploaded":
            filename = meta.get('filename')
            summary_lines.append(f"{date}: audio_uploaded ({filename})")
        elif activity == "math_problem_solved":
            summary_lines.append(f"{date}: math_problem_solved")
        elif activity == "question_asked":
            q = meta.get('question') or ''
            summary_lines.append(f"{date}: question_asked ({q[:32]}...)")
        else:
            summary_lines.append(f"{date}: {activity}")

    return "\n".join(summary_lines)

@router.post("/personal", response_model=RecommendationsResponse)
async def generate_recommendations(request: RecommendationsRequest):
    try:
        # 1. Get user activity logs for last N days
        since = datetime.utcnow() - timedelta(days=request.days or 14)
        logs = (
            supabase_db
            .table('user_activities')
            .select("*")
            .eq('user_id', request.user_id)
            .gte('timestamp', since.isoformat())
            .execute()
            .data
        )
        if not logs:
            raise HTTPException(status_code=404, detail="No activity logs found for user.")

        # 2. Summarize logs for Gemini prompt
        activity_summary = summarize_activity_logs(logs)

        # 3. Build Gemini prompt
        prompt = (
            "Analyze this user's recent Alif activity history and suggest 3 personalized, actionable next steps for them to boost their learning. "
            "Focus on recommending features, strategies, or habits they haven't tried enough. "
            "Respond ONLY as a JSON array of strings (no explanations, no markdown, no code fences).\n"
            f"User Activity Log:\n{activity_summary}\n"
        )

        # 4. Call Gemini and parse response
        try:
            gemini_response = call_gemini(prompt)
            print("Gemini output:", gemini_response)  # <-- For debugging

            # Remove code fences and any extra non-JSON text
            cleaned = gemini_response.strip()
            cleaned = re.sub(r"^```json|^```|```$", "", cleaned, flags=re.MULTILINE).strip()

            # Find first '[' and last ']' in case Gemini adds extra explanation
            start = cleaned.find('[')
            end = cleaned.rfind(']')
            if start != -1 and end != -1:
                cleaned = cleaned[start:end+1]

            suggestions = json.loads(cleaned)
            # Optional: Validate output is a list of strings
            if not isinstance(suggestions, list) or not all(isinstance(s, str) for s in suggestions):
                raise ValueError("Invalid Gemini output format")
        except Exception as e:
            print("Error parsing Gemini output:", e)
            # Fallback: generic suggestions
            suggestions = [
                "Try generating flashcards for your recent notes.",
                "Set a weekly study goal to maintain your streak.",
                "Review your recent quiz results for common mistakes."
            ]

        return RecommendationsResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {e}")