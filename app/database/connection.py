from supabase import create_client, Client
from app.core.config import settings

class DatabaseConnection:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super().__new__(cls)
            cls._instance.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY

            )
        return cls._instance

    def get_client(self) -> Client:
        return self.client


supabase_db = DatabaseConnection().get_client()