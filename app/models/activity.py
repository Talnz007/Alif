from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ActivityBase(BaseModel):
    id: Optional[int] = None
    user_id: int
    activity_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[dict] = None


class UserActivityLog(BaseModel):
    total_activities: int
    recent_activities: list[ActivityBase]