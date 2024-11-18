from fastapi import APIRouter, HTTPException, Query

router = APIRouter()


@router.get("/health-check")
async def health_check():
    """Endpoint to check the health status of the application"""
    return {"status": "Application is running smoothly"}


@router.get("/text-processing")
async def process_text(input_text: str = Query(..., min_length=1, max_length=1000)):
    """Endpoint to perform basic text processing (e.g., word count, character count)"""
    if not input_text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    word_count = len(input_text.split())
    char_count = len(input_text)

    return {
        "input_text": input_text,
        "word_count": word_count,
        "character_count": char_count
    }


@router.post("/reverse-text")
async def reverse_text(input_text: str):
    """Endpoint to reverse a given string"""
    if not input_text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    reversed_text = input_text[::-1]
    return {
        "original_text": input_text,
        "reversed_text": reversed_text
    }
