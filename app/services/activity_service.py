from typing import List, Optional
from datetime import datetime, timedelta
from app.database.connection import supabase_db
from app.core.exception import CustomHTTPException
from app.core.app_logging import app_logger
from app.models.activity import UserActivityLog, ActivityBase


class ActivityService:
    def __init__(self):
        self.db = supabase_db

    async def log_activity(self, user_id: str, activity_type: str, details: dict = None) -> bool:
        """Log a user activity"""
        try:
            activity = {
                "user_id": user_id,
                "activity_type": activity_type
            }
            if details:
                activity["details"] = details

            result = self.db.table('user_activities').insert(activity).execute()
            return bool(result.data)

        except Exception as e:
            app_logger.error(f"Failed to log activity: {str(e)}")
            return False

    async def get_user_activities(
            self,
            user_id: str,
            days: int = 7,
            activity_type: Optional[str] = None
    ) -> UserActivityLog:
        """Get user activities for the specified period"""
        try:
            query = self.db.table('user_activities') \
                .select("*") \
                .eq("user_id", user_id) \
                .gte("timestamp", datetime.utcnow() - timedelta(days=days))

            if activity_type:
                query = query.eq("activity_type", activity_type)

            result = query.order("timestamp", desc=True).execute()

            activities = [
                ActivityBase(
                    id=row["id"],
                    user_id=row["user_id"],
                    activity_type=row["activity_type"],
                    timestamp=row["timestamp"],
                    details=row.get("details")
                )
                for row in result.data
            ]

            return UserActivityLog(
                total_activities=len(activities),
                recent_activities=activities
            )

        except Exception as e:
            app_logger.error(f"Failed to get user activities: {str(e)}")
            raise CustomHTTPException("Failed to retrieve user activities")

    async def get_activity_stats(self, user_id: str) -> dict:
        """Get activity statistics for a user"""
        try:
            # Get activities from the last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)

            result = self.db.table('user_activities') \
                .select("activity_type, count") \
                .eq("user_id", user_id) \
                .gte("timestamp", thirty_days_ago) \
                .execute()

            # Count activities by type
            activity_counts = {}
            for row in result.data:
                activity_type = row["activity_type"]
                activity_counts[activity_type] = activity_counts.get(activity_type, 0) + 1

            return {
                "total_activities": len(result.data),
                "activity_breakdown": activity_counts,
                "period_start": thirty_days_ago.isoformat(),
                "period_end": datetime.utcnow().isoformat()
            }

        except Exception as e:
            app_logger.error(f"Failed to get activity stats: {str(e)}")
            raise CustomHTTPException("Failed to retrieve activity statistics")