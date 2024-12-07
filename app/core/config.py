from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Alif"
    API_V1_STR: str = "/api/v1"
    LLAMA_KEY: str = os.getenv("LLAMA_KEY", "")
    GEMINI_KEY: str = os.getenv("GEMINI_KEY", "")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "JLIng3lYVkuRmLIcwfI51DtxSXQdxNFrxqAZrBkCSb8")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30



class Config:
    env_file = ".env"
    extra = 'ignore'

settings = Settings()
