from supabase import create_client, Client
from app.core.config import settings
from typing import Optional, Dict, Any

class UserService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    async def get_user_by_username(self, username: str):
        """Get a user by username with case-insensitive matching"""
        # Normalize username to lowercase
        normalized_username = username.lower() if username else None

        if not normalized_username:
            return None

        # Try case-insensitive match using ilike
        user_result = self.supabase.table('users').select("*").ilike("username", normalized_username).execute()

        # If no results or ilike not supported, try alternative approach
        if not user_result.data:
            # Get all users and filter manually
            all_users = self.supabase.table('users').select("*").execute()
            user_result.data = [
                user for user in all_users.data
                if user.get('username', '').lower() == normalized_username or
                   user.get('email', '').lower() == normalized_username
            ]

        if user_result.data:
            return user_result.data[0]

        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[Any, Any]]:
        """Get user by ID from database"""
        try:
            result = self.supabase.table('users').select("*").eq('id', user_id).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None