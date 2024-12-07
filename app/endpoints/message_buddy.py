from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from app.services.message_buddy_service import process_image_with_llama
from app.core.schemas import APIResponse

router = APIRouter()

@router.post("/process_image", response_model=APIResponse[dict])
async def process_image(image: UploadFile = File(...), query: str = Form(None)):
    """
    Endpoint to process an image and optional query using NVIDIA's Vision model.

    Args:
        image (UploadFile): The uploaded image file.
        query (str, optional): Additional context or instructions for the model.

    Returns:
        APIResponse: Model's response wrapped in the API schema.
    """
    try:
        # Process the image using Llama Vision API and handle the optional query
        result = await process_image_with_llama(image, query)
        return APIResponse(
            success=True,
            message="Image processed successfully.",
            data=result
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

