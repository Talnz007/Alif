import os
from typing import List, Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
from pydantic import BaseModel
from app.core.app_logging import app_logger

class BadgeManager:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
        self.badge_cache = self._load_badges_cache()

    def _load_badges_cache(self):
        """Load badges into memory for faster access"""
        try:
            badges = self.supabase.table('badges').select('*').execute()
            return {badge['id']: badge for badge in badges.data}
        except Exception as e:
            app_logger.error(f"Error loading badge cache: {e}")
            return {}

    def award_badge(self, user_id: str, badge_id: int) -> bool:
        """
        Efficiently award a badge to a user
        Prevents duplicate awards and handles errors
        """
        try:
            if badge_id not in self.badge_cache:
                app_logger.warning(f"Badge {badge_id} does not exist")
                return False

            result = self.supabase.table('user_badges').upsert({
                'user_id': user_id,
                'badge_id': badge_id
            }, on_conflict='user_id,badge_id').execute()

            return len(result.data) > 0
        except Exception as e:
            app_logger.error(f"Badge award error: {e}")
            return False

    def get_user_badges(self, user_id: str) -> List[dict]:
        """
        Efficiently retrieve user's earned badges
        Uses cached badge information
        """
        try:
            result = self.supabase.table('user_badges') \
                .select('badge_id, badges(name, description, image_url, activity_type, count, consecutive_days, streak_required, leaderboard_criterion, badge_count_required)') \
                .eq('user_id', user_id) \
                .execute()

            return [
                {
                    'id': row['badge_id'],
                    'name': row['badges']['name'],
                    'description': row['badges']['description'],
                    'image_url': row['badges']['image_url'],
                    'activity_type': row['badges']['activity_type'],
                    'count': row['badges']['count'],
                    'consecutive_days': row['badges']['consecutive_days'],
                    'streak_required': row['badges']['streak_required'],
                    'leaderboard_criterion': row['badges']['leaderboard_criterion'],
                    'badge_count_required': row['badges']['badge_count_required']
                }
                for row in result.data
            ]
        except Exception as e:
            app_logger.error(f"Error retrieving user badges: {e}")
            return []

    def check_badge_progress(self, user_id: str, badge_id: int) -> dict:
        """
        Check progress towards a specific badge based on its criteria
        """
        try:
            if badge_id not in self.badge_cache:
                return {'progress': 0, 'total_required': 0, 'is_earned': False}

            badge = self.badge_cache[badge_id]
            progress = 0
            total_required = 0
            is_earned = False

            current_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            streak_result = self.supabase.table('user_streaks') \
                .select("current_streak, last_activity_date") \
                .eq('user_id', user_id) \
                .execute()
            last_activity = streak_result.data[0].get("last_activity_date") if streak_result.data else None
            streak_active = False
            if last_activity:
                last_activity_date = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
                days_since_last = (current_date - last_activity_date).days
                streak_active = days_since_last <= 1  # Reset if more than 1 day inactive

            # Handle activity count badges
            if badge.get('activity_type') and badge.get('count') is not None:
                activity_type = badge['activity_type']
                total_required = badge['count']
                count = self.supabase.table('user_activities') \
                    .select('id', count='exact') \
                    .eq('user_id', user_id) \
                    .eq('activity_type', activity_type) \
                    .execute().count or 0
                progress = count
                is_earned = count >= total_required

            # Handle consecutive days badges
            elif badge.get('activity_type') and badge.get('consecutive_days') is not None:
                activity_type = badge['activity_type']
                total_required = badge['consecutive_days']
                consecutive_days = self._check_consecutive_days(user_id, activity_type)
                progress = consecutive_days if streak_active else 0  # Reset if streak broken
                is_earned = consecutive_days >= total_required if streak_active else False

            # Handle streak badges
            elif badge.get('streak_required') is not None:
                total_required = badge['streak_required']
                progress = streak_result.data[0].get("current_streak", 0) if streak_result.data and streak_active else 0
                is_earned = progress >= total_required

            # Handle leaderboard badges
            elif badge.get('leaderboard_criterion') is not None:
                if badge['leaderboard_criterion'] == 'entered' and badge_id == 15:
                    total_required = 1
                    result = self.supabase.table('user_activities') \
                        .select('id', count='exact') \
                        .eq('user_id', user_id) \
                        .eq('activity_type', 'leaderboard_updated') \
                        .execute()
                    progress = result.count or 0
                    is_earned = progress >= 1
                elif badge['leaderboard_criterion'] == 'top_10_percent' and badge_id == 16:
                    total_required = 1
                    result = self.supabase.table('user_activities') \
                        .select('metadata') \
                        .eq('user_id', user_id) \
                        .eq('activity_type', 'leaderboard_updated') \
                        .order('timestamp', desc=True) \
                        .limit(1) \
                        .execute()
                    position = result.data[0].get('metadata', {}).get('position', 100) if result.data else 100
                    total_users = result.data[0].get('metadata', {}).get('total_users', 100) if result.data else 100
                    percentile = (position / total_users) * 100 if total_users > 0 else 100
                    progress = 1 if percentile <= 10 else 0
                    is_earned = progress == 1

            # Handle badge collection badges
            elif badge.get('badge_count_required') is not None:
                total_required = badge['badge_count_required']
                user_badges = self.get_user_badges(user_id)
                progress = len(user_badges)
                is_earned = progress >= total_required

            app_logger.info(f"Badge {badge_id} progress: {progress}/{total_required}, is_earned: {is_earned}")
            return {
                'progress': progress,
                'total_required': total_required,
                'is_earned': is_earned
            }

        except Exception as e:
            app_logger.error(f"Error checking badge progress for badge {badge_id}: {e}")
            return {'progress': 0, 'total_required': 10, 'is_earned': False}

    def _check_consecutive_days(self, user_id: str, activity_type: str) -> int:
        """Helper method to check consecutive days"""
        try:
            result = self.supabase.table('user_activities') \
                .select("timestamp") \
                .eq("user_id", user_id) \
                .eq("activity_type", activity_type) \
                .order("timestamp", desc=True) \
                .execute()

            if not result.data:
                return 0

            days_active = set()
            for item in result.data:
                timestamp = item.get("timestamp", "")
                if timestamp:
                    day = timestamp.split("T")[0] if "T" in timestamp else timestamp.split(" ")[0]
                    days_active.add(day)

            sorted_days = sorted(days_active)
            max_consecutive = 1
            current_consecutive = 1

            for i in range(1, len(sorted_days)):
                prev_day = sorted_days[i - 1]
                curr_day = sorted_days[i]
                from datetime import datetime, timedelta
                prev_date = datetime.fromisoformat(prev_day)
                curr_date = datetime.fromisoformat(curr_day)

                if (curr_date - prev_date) == timedelta(days=1):
                    current_consecutive += 1
                else:
                    current_consecutive = 1

                max_consecutive = max(max_consecutive, current_consecutive)

            return max_consecutive
        except Exception as e:
            app_logger.error(f"Error checking consecutive days: {e}")
            return 0

    def get_all_badges(self) -> List[dict]:
        """
        Return all badges from cache
        """
        return list(self.badge_cache.values())