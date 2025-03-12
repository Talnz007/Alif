from supabase import create_client, Client
from app.core.config import settings
from typing import Optional, Dict, Any

class UserService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    async def get_user_by_username(self, username: str) -> Optional[Dict[Any, Any]]:
        """Get user by username from database"""
        try:
            result = self.supabase.table('users').select("*").eq('username', username).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[Any, Any]]:
        """Get user by ID from database"""
        try:
            result = self.supabase.table('users').select("*").eq('id', user_id).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None