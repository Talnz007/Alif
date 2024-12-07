from fastapi import APIRouter, UploadFile, File
from pathlib import Path
from app.core.exception import CustomHTTPException
from app.core.schemas import APIResponse
from app.services.audio import process_audio_file
from app.utils.helper_functions import save_file_async
from app.core.security import get_current_user
from fastapi import Depends
import os

router = APIRouter()

@router.post("/transcribe", response_model=APIResponse[dict])
async def transcribe_audio(
        file: UploadFile = File(...)
):
    try:
        file_path = await save_file_async(file, Path("temp_uploads"))

        result = await process_audio_file(file_path)

        os.remove(file_path)

        return APIResponse(
            success=True,
            message="Audio transcribed successfully",
            data={"transcription": result["text"]}
        )
    except FileNotFoundError:
        raise CustomHTTPException("File not found")
    except RuntimeError as e:
        raise CustomHTTPException(f"Transcription failed: {str(e)}")
    except Exception as e:
        raise CustomHTTPException(f"An error occurred: {str(e)}")