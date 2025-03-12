from core.security import get_current_user
from fastapi import APIRouter, Depends
async def debug_current_user(current_user=Depends(get_current_user)):
    return {
        "user_type": str(type(current_user)),
        "user_data": current_user,
        "user_id": current_user.get('id') if isinstance(current_user, dict) else None
    }