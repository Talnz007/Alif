from fastapi import APIRouter, UploadFile, File, Query
from pathlib import Path
from app.core.exception import CustomHTTPException
from app.core.schemas import APIResponse
from app.services.audio import process_audio_file
from app.utils.helper_functions import save_file_async
from fastapi import Depends
import os
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter()


class ProcessingMode(str, Enum):
    transcript = "transcript"
    summary = "summary"
    both = "both"


class AudioSummaryResponse(BaseModel):
    transcript: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    bullet_points: Optional[List[str]] = None


@router.post("/transcribe", response_model=APIResponse[dict])
async def transcribe_audio(
        file: UploadFile = File(...),
        mode: ProcessingMode = Query(ProcessingMode.both, description="Processing mode")
):
    """
    Transcribe and/or summarize audio file.

    - mode=transcript: Only transcribe the audio
    - mode=summary: Only generate a summary
    - mode=both: Generate both transcript and summary
    """
    try:
        # Validate file type
        valid_extensions = [".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac", ".aiff"]
        file_ext = os.path.splitext(file.filename)[1].lower()

        if file_ext not in valid_extensions:
            raise CustomHTTPException("Invalid file format. Supported formats: MP3, WAV, M4A, OGG, AAC, FLAC, AIFF")

        # Save file temporarily
        file_path = await save_file_async(file, Path("temp_uploads"))

        # Process audio with Gemini
        result = await process_audio_file(file_path, mode=mode.value)

        # Clean up temp file
        os.remove(file_path)

        # Prepare response data
        response_data = {}
        if "transcript" in result:
            response_data["transcript"] = result["transcript"]
        if "title" in result:
            response_data["title"] = result["title"]
        if "summary" in result:
            response_data["summary"] = result["summary"]
        if "bullet_points" in result:
            response_data["bullet_points"] = result["bullet_points"]

        return APIResponse(
            success=True,
            message="Audio processed successfully",
            data=response_data
        )
    except FileNotFoundError:
        raise CustomHTTPException("File not found")
    except RuntimeError as e:
        raise CustomHTTPException(f"Processing failed: {str(e)}")
    except Exception as e:
        raise CustomHTTPException(f"An error occurred: {str(e)}")