from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from app.core.config import settings
import requests


YOUTUBE_API_KEY = 'AIzaSyCSzb408fWi5aS5nl9ZA2IqgsmMTP_9QVU'
YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search'

# Initialize NVIDIA Llama client
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.LLAMA_KEY  # Replace with your actual API key
)

router = APIRouter()


class ChatRequest(BaseModel):
    query: str  # Define query as a Pydantic model to validate the request body

async def fetch_youtube_recommendations(query: str, max_results: int = 3):
    try:
        # Construct YouTube API request
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "key": YOUTUBE_API_KEY,
        }
        response = requests.get(YOUTUBE_API_URL, params=params)
        response.raise_for_status()
        data = response.json()

        # Extract video titles and URLs
        videos = [
            {
                "title": item["snippet"]["title"],
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
            }
            for item in data.get("items", [])
        ]
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch YouTube videos: {e}")


@router.post("/chat")
async def chat_with_bot(request: dict):
    """
    Endpoint to handle user chat.
    """
    try:
        query = request.get('query', '').strip()
        context = request.get('context', [])

        # Fetch the PDF summary from the context
        pdf_summary = next(
            (item['content'] for item in context if item['role'] == 'system' and 'Document summary:' in item['content']),
            ""
        )

        # If the user sends a query and a summary exists, include it in the context
        messages = context + [{"role": "user", "content": f"{query}\n\n{pdf_summary}"}]

        completion = client.chat.completions.create(
            model="meta/llama-3.1-405b-instruct",
            messages=messages,
            temperature=0.2,
            top_p=0.7,
            max_tokens=1024,
            stream=False,
        )

        response = completion.choices[0].message.content.strip()

        return {"success": True, "response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/recommendations")
async def recommend_videos(request: dict):
    try:
        query = request.get('query', '')
        videos = await fetch_youtube_recommendations(query)
        return {"success": True, "videos": videos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")