from typing import List, Dict, Any
from app.services.badges_service import BadgeService
from app.core.app_logging import app_logger

# Mapping between different activity type variations
ACTIVITY_TYPE_MAPPING = {
    # Login activities
    "login": ["login", "user_login"],

    # Content activities
    "audio_processed": ["audio_processed", "audio_uploaded"],
    "document_analyzed": ["document_analyzed", "document_uploaded"],
    "text_summarized": ["text_summarized"],

    # Goal activities
    "goal_created": ["goal_created", "goal_set"],
    "goal_achieved": ["goal_achieved", "goal_completed"],

    # No changes needed for these
    "question_asked": ["question_asked"],
    "leaderboard_updated": ["leaderboard_updated"],

    # New activity types
    "math_problem_solved": ["math_problem_solved"],
    "quiz_generated": ["quiz_generated"],
    "quiz_completed": ["quiz_completed"],
    "flashcards_generated": ["flashcards_generated"]
}

# Complete badge criteria for all 20 badges
BADGE_CRITERIA = {
    # Login and first-time badges
    1: {"activity_type": "login", "count": 1, "name": "First Step"},
    2: {"activity_type": "login", "consecutive_days": 7, "name": "Daily Learner"},
    3: {"activity_type": "login", "consecutive_days": 30, "name": "Consistent Learner"},
    12: {"activity_type": "goal_created", "count": 1, "name": "Goal Setter"},

    # Streak badges
    4: {"streak": 3, "name": "Streak Starter"},
    5: {"streak": 10, "name": "Streak Master"},
    14: {"streak": 30, "name": "Streak Specialist"},

    # Content badges - Text
    6: {"activity_type": "text_summarized", "count": 10, "name": "Summarization Star"},
    17: {"activity_type": "text_summarized", "count": 20, "name": "Knowledge Seeker"},

    # Content badges - Audio
    7: {"activity_type": "audio_processed", "count": 5, "name": "Audio Enthusiast"},
    18: {"activity_type": "audio_processed", "count": 15, "name": "Audio Analyzer"},

    # Content badges - Document
    8: {"activity_type": "document_analyzed", "count": 10, "name": "Document Guru"},
    19: {"activity_type": "document_analyzed", "count": 20, "name": "Document Pro"},

    # Achievement badges
    11: {"activity_type": "question_asked", "count": 20, "name": "Curious Learner"},
    13: {"activity_type": "goal_achieved", "count": 1, "name": "Goal Achiever"},

    # Leaderboard badges
    15: {"leaderboard": "entered", "name": "Leaderboard Rookie"},
    16: {"leaderboard": "top_10_percent", "name": "Top Performer"},

    # Collection badges
    9: {"badge_count": 5, "name": "Badge Collector"},
    10: {"badge_count": 10, "name": "Super Collector"},
    20: {"badge_count": 19, "name": "Ultimate Learner"},
}


class BadgeChecker:
    def __init__(self, badge_service: BadgeService):
        self.badge_service = badge_service
        self.db = badge_service.db

    async def check_activity_badges(self, user_id: str, activity_type: str, metadata: Dict = None) -> List[Dict]:
        """Check if a new activity qualifies for any badges"""
        awarded_badges = []
        metadata = metadata or {}

        # Log received activity type
        app_logger.info(f"Checking badges for activity: {activity_type}")

        # First get user's current badges to avoid duplicates
        current_badges = await self.badge_service.get_user_badges(user_id)
        current_badge_ids = [badge["id"] for badge in current_badges]

        # Check activity-based badges
        for badge_id, criteria in BADGE_CRITERIA.items():
            # Skip if user already has this badge
            if badge_id in current_badge_ids:
                continue

            # Check activity count badges
            if "activity_type" in criteria:
                criteria_type = criteria["activity_type"]
                # Check if the current activity matches any variation of the criteria type
                if any(activity_type == variation for variation in ACTIVITY_TYPE_MAPPING.get(criteria_type, [criteria_type])):
                    try:
                        # Simple count check
                        if "count" in criteria:
                            count = await self._get_activity_count(user_id, criteria_type)
                            app_logger.info(f"Badge {badge_id}: counted {count} activities of type {criteria_type}")
                            if count >= criteria["count"]:
                                success = await self.badge_service.award_badge(user_id, badge_id)
                                if success:
                                    awarded_badges.append({
                                        "id": badge_id,
                                        "name": criteria["name"]
                                    })
                                    app_logger.info(f"Awarded badge {criteria['name']} to user {user_id}")

                        # Consecutive days check for login badges
                        elif "consecutive_days" in criteria:
                            consecutive_days = await self._check_consecutive_days(user_id, criteria_type, criteria["consecutive_days"])
                            app_logger.info(f"Badge {badge_id}: found {consecutive_days} consecutive days for {criteria_type}")
                            if consecutive_days >= criteria["consecutive_days"]:
                                success = await self.badge_service.award_badge(user_id, badge_id)
                                if success:
                                    awarded_badges.append({
                                        "id": badge_id,
                                        "name": criteria["name"]
                                    })
                                    app_logger.info(f"Awarded badge {criteria['name']} to user {user_id}")
                    except Exception as e:
                        app_logger.error(f"Error checking badge {badge_id}: {str(e)}")

        # Check streak badges if relevant
        if activity_type in ["login", "user_login", "study_session", "assignment_completed"]:
            await self._check_streak_badges(user_id, current_badge_ids, awarded_badges)

        # Check leaderboard badges if relevant
        if activity_type == "leaderboard_updated" and metadata.get("position"):
            await self._check_leaderboard_badges(user_id, current_badge_ids, metadata.get("position"), metadata.get("total_users", 100), awarded_badges)

        # Check badge collection badges after potentially awarding others
        if awarded_badges:
            await self._check_collection_badges(user_id, current_badge_ids + [b["id"] for b in awarded_badges], awarded_badges)

        return awarded_badges

    async def _get_activity_count(self, user_id: str, activity_type: str) -> int:
        """Get count of a specific activity for user, handling multiple variations"""
        try:
            # Get the possible variations of this activity type
            activity_variations = ACTIVITY_TYPE_MAPPING.get(activity_type, [activity_type])

            # If only one variation, use direct query
            if len(activity_variations) == 1:
                result = self.db.table('user_activities') \
                    .select("id", count="exact") \
                    .eq("user_id", user_id) \
                    .eq("activity_type", activity_variations[0]) \
                    .execute()
                return result.count or 0

            # For multiple variations, we need to use OR filters
            filter_string = ",".join([f"activity_type.eq.{variation}" for variation in activity_variations])
            result = self.db.table('user_activities') \
                .select("id", count="exact") \
                .eq("user_id", user_id) \
                .or_(filter_string) \
                .execute()

            app_logger.info(f"Counted activities for {activity_type}: {result.count} (variations: {activity_variations})")
            return result.count or 0

        except Exception as e:
            app_logger.error(f"Error counting activities: {str(e)}")
            return 0

    async def _check_consecutive_days(self, user_id: str, activity_type: str, days: int) -> int:
        """Check consecutive days of a specific activity, handling multiple variations"""
        try:
            # Get the possible variations of this activity type
            activity_variations = ACTIVITY_TYPE_MAPPING.get(activity_type, [activity_type])

            # Query for all variations
            if len(activity_variations) == 1:
                result = self.db.table('user_activities') \
                    .select("timestamp") \
                    .eq("user_id", user_id) \
                    .eq("activity_type", activity_variations[0]) \
                    .order("timestamp", desc=True) \
                    .execute()
            else:
                filter_string = ",".join([f"activity_type.eq.{variation}" for variation in activity_variations])
                result = self.db.table('user_activities') \
                    .select("timestamp") \
                    .eq("user_id", user_id) \
                    .or_(filter_string) \
                    .order("timestamp", desc=True) \
                    .execute()

            if not result.data:
                return 0

            # Group activities by day
            days_active = set()
            for item in result.data:
                timestamp = item.get("timestamp", "")
                if timestamp:
                    # Extract just the date part (YYYY-MM-DD)
                    day = timestamp.split("T")[0] if "T" in timestamp else timestamp.split(" ")[0]
                    days_active.add(day)

            # Sort days to check for consecutive
            sorted_days = sorted(days_active)

            # Check max consecutive days
            max_consecutive = 1
            current_consecutive = 1

            for i in range(1, len(sorted_days)):
                # Parse dates to check if consecutive
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
            app_logger.error(f"Error checking consecutive days: {str(e)}")
            return 0

    async def _check_streak_badges(self, user_id: str, current_badge_ids: List[int], awarded_badges: List[Dict]):
        """Check if user qualifies for streak badges"""
        try:
            result = self.db.table('user_streaks') \
                .select("current_streak") \
                .eq("user_id", user_id) \
                .execute()

            if not result.data:
                return

            current_streak = result.data[0].get("current_streak", 0)

            # Check each streak badge
            for badge_id, criteria in BADGE_CRITERIA.items():
                if "streak" in criteria and badge_id not in current_badge_ids:
                    if current_streak >= criteria["streak"]:
                        success = await self.badge_service.award_badge(user_id, badge_id)
                        if success:
                            awarded_badges.append({
                                "id": badge_id,
                                "name": criteria["name"]
                            })
        except Exception as e:
            app_logger.error(f"Error checking streak badges: {str(e)}")

    async def _check_leaderboard_badges(self, user_id: str, current_badge_ids: List[int], position: int,
                                        total_users: int, awarded_badges: List[Dict]):
        """Check if user qualifies for leaderboard badges"""
        try:
            # Leaderboard Rookie - just for being on the leaderboard
            if 15 not in current_badge_ids:
                success = await self.badge_service.award_badge(user_id, 15)
                if success:
                    awarded_badges.append({
                        "id": 15,
                        "name": "Leaderboard Rookie"
                    })

            # Top Performer - top 10%
            if 16 not in current_badge_ids:
                percentile = (position / total_users) * 100
                if percentile <= 10:  # Top 10%
                    success = await self.badge_service.award_badge(user_id, 16)
                    if success:
                        awarded_badges.append({
                            "id": 16,
                            "name": "Top Performer"
                        })
        except Exception as e:
            app_logger.error(f"Error checking leaderboard badges: {str(e)}")

    async def _check_collection_badges(self, user_id: str, all_badge_ids: List[int], awarded_badges: List[Dict]):
        """Check if user qualifies for badge collection badges"""
        try:
            badge_count = len(all_badge_ids)

            for badge_id, criteria in BADGE_CRITERIA.items():
                if "badge_count" in criteria and badge_id not in all_badge_ids:
                    if badge_count >= criteria["badge_count"]:
                        success = await self.badge_service.award_badge(user_id, badge_id)
                        if success:
                            awarded_badges.append({
                                "id": badge_id,
                                "name": criteria["name"]
                            })
        except Exception as e:
            app_logger.error(f"Error checking collection badges: {str(e)}")

    async def retrospective_check(self, user_id: str) -> List[Dict]:
        """Check and award all badges a user qualifies for based on past activities"""
        awarded_badges = []
        app_logger.info(f"Running retrospective badge check for user {user_id}")

        # Get user's current badges
        current_badges = await self.badge_service.get_user_badges(user_id)
        current_badge_ids = [badge["id"] for badge in current_badges]
        app_logger.info(f"User has {len(current_badge_ids)} badges already: {current_badge_ids}")

        # Check for login badge (first step)
        if 1 not in current_badge_ids:
            count = await self._get_activity_count(user_id, "login")
            if count > 0:
                success = await self.badge_service.award_badge(user_id, 1)
                if success:
                    awarded_badges.append({"id": 1, "name": "First Step"})
                    current_badge_ids.append(1)
                    app_logger.info(f"Awarded badge: First Step")

        # Check all activity-based badges with count criteria
        activity_types = set(c["activity_type"] for c in BADGE_CRITERIA.values()
                             if "activity_type" in c and "count" in c)

        for activity_type in activity_types:
            count = await self._get_activity_count(user_id, activity_type)
            app_logger.info(f"Activity type {activity_type}: count = {count}")

            for badge_id, criteria in BADGE_CRITERIA.items():
                if ("activity_type" in criteria and criteria["activity_type"] == activity_type and
                        "count" in criteria):
                    if badge_id not in current_badge_ids and count >= criteria["count"]:
                        success = await self.badge_service.award_badge(user_id, badge_id)
                        if success:
                            awarded_badges.append({
                                "id": badge_id,
                                "name": criteria["name"]
                            })
                            current_badge_ids.append(badge_id)
                            app_logger.info(f"Awarded badge: {criteria['name']}")

        # Check consecutive day badges
        for badge_id, criteria in BADGE_CRITERIA.items():
            if "consecutive_days" in criteria and badge_id not in current_badge_ids:
                activity_type = criteria.get("activity_type", "login")
                days = await self._check_consecutive_days(user_id, activity_type, criteria["consecutive_days"])
                if days >= criteria["consecutive_days"]:
                    success = await self.badge_service.award_badge(user_id, badge_id)
                    if success:
                        awarded_badges.append({
                            "id": badge_id,
                            "name": criteria["name"]
                        })
                        current_badge_ids.append(badge_id)
                        app_logger.info(f"Awarded badge: {criteria['name']}")

        # Check streak badges
        await self._check_streak_badges(user_id, current_badge_ids, awarded_badges)
        current_badge_ids.extend([b["id"] for b in awarded_badges])

        # Finally check collection badges
        await self._check_collection_badges(user_id, current_badge_ids, awarded_badges)
        app_logger.info(f"Awarded {len(awarded_badges)} badges in total")

        return awarded_badges