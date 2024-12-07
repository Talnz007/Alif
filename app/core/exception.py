from fastapi import HTTPException
from app.core.app_logging import app_logger

class CustomHTTPException(HTTPException):
    def __init__(self, detail: str, status_code: int = 400):
        super().__init__(status_code=status_code, detail=detail)
        app_logger.error(f"HTTP Exception: {detail} (Status Code: {status_code})")