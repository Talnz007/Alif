import os
from typing import List, Optional
from datetime import datetime
from supabase import create_client, Client
from pydantic import BaseModel


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
            print(f"Error loading badge cache: {e}")
            return {}

    def award_badge(self, user_id: str, badge_id: int) -> bool:
        """
        Efficiently award a badge to a user
        Prevents duplicate awards and handles errors
        """
        try:
            # Check if badge exists
            if badge_id not in self.badge_cache:
                print(f"Badge {badge_id} does not exist")
                return False

            # Atomic insert to prevent duplicates
            result = self.supabase.table('user_badges').upsert({
                'user_id': user_id,
                'badge_id': badge_id
            }, on_conflict='user_id,badge_id').execute()

            return len(result.data) > 0
        except Exception as e:
            print(f"Badge award error: {e}")
            return False

    def get_user_badges(self, user_id: str) -> List[dict]:
        """
        Efficiently retrieve user's earned badges
        Uses cached badge information
        """
        try:
            # Efficient join to get badge details
            result = self.supabase.table('user_badges') \
                .select('badge_id, badges(name, description, image_url)') \
                .eq('user_id', user_id) \
                .execute()

            return [
                {
                    'id': row['badge_id'],
                    'name': row['badges']['name'],
                    'description': row['badges']['description'],
                    'image_url': row['badges']['image_url']
                }
                for row in result.data
            ]
        except Exception as e:
            print(f"Error retrieving user badges: {e}")
            return []

    def check_badge_progress(self, user_id: str, badge_id: int) -> dict:
        """
        Check progress towards a specific badge
        Placeholder method to be customized based on specific tracking
        """
        # Implement specific progress tracking logic
        # This will depend on how you track user activities
        return {
            'progress': 0,
            'total_required': 10,
            'is_earned': False
        }

    def get_all_badges(self) -> List[dict]:
        """
        Return all badges from cache
        """
        return list(self.badge_cache.values())


# Example usage
def main():
    badge_manager = BadgeManager()

    # Award a badge
    user_id = 'some-user-uuid'
    badge_id = 1  # First badge
    result = badge_manager.award_badge(user_id, badge_id)

    # Get user's badges
    user_badges = badge_manager.get_user_badges(user_id)
    print(user_badges)


if __name__ == "__main__":
    main()