from typing import List, Optional
from app.core.exception import CustomHTTPException
from app.database.connection import supabase_db
from app.core.app_logging import app_logger

class BadgeService:
    def __init__(self):
        self.db = supabase_db
        self._badge_cache = {}
        self._load_badges()

    def _load_badges(self):
        """Load badges into memory cache"""
        try:
            result = self.db.table('badges').select("*").execute()
            self._badge_cache = {badge['id']: badge for badge in result.data}
        except Exception as e:
            app_logger.error(f"Failed to load badges: {str(e)}")
            raise CustomHTTPException("Failed to initialize badge service")

    async def award_badge(self, user_id: str, badge_id: int) -> bool:
        """Award a badge to a user"""
        try:
            if badge_id not in self._badge_cache:
                return False

            result = self.db.table('user_badges').insert({
                "user_id": user_id,
                "badge_id": badge_id
            }).execute()

            if result.data:
                await self._log_badge_award(user_id, badge_id)
                return True
            return False

        except Exception as e:
            app_logger.error(f"Failed to award badge: {str(e)}")
            return False

    async def get_user_badges(self, user_id: str) -> List[dict]:
        """Get all badges for a user"""
        try:
            result = self.db.table('user_badges')\
                .select("badge_id, badges(name, description, image_url)")\
                .eq("user_id", user_id)\
                .execute()

            return [
                {
                    "id": row["badge_id"],
                    "name": row["badges"]["name"],
                    "description": row["badges"]["description"],
                    "image_url": row["badges"]["image_url"]
                }
                for row in result.data
            ]

        except Exception as e:
            app_logger.error(f"Failed to get user badges: {str(e)}")
            return []

    async def _log_badge_award(self, user_id: str, badge_id: int):
        """Log badge award in user activities"""
        try:
            badge_name = self._badge_cache[badge_id]["name"]
            self.db.table('user_activities').insert({
                "user_id": user_id,
                "activity_type": f"badge_awarded_{badge_name}"
            }).execute()
        except Exception as e:
            app_logger.error(f"Failed to log badge award: {str(e)}")