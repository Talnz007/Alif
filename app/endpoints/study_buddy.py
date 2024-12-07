from fastapi import APIRouter
from app.core.exception import CustomHTTPException
from app.core.schemas import APIResponse
from app.services.studdy_buddy_service import chat_with_bot
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    query: str


@router.post("/chat", response_model=APIResponse[dict])
async def chat_with_bot(query: str):
    try:
        response = await chat_with_bot(query)
        return APIResponse(
            success=True,
            message="Chatbot response fetched successfully",
            data=response
        )
    except Exception as e:
        raise CustomHTTPException(f"An error occurred: {str(e)}")
