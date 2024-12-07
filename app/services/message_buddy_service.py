import base64
import requests
from fastapi import HTTPException, UploadFile
from io import BytesIO

# NVIDIA API details
INVOKE_URL = "https://ai.api.nvidia.com/v1/gr/meta/llama-3.2-90b-vision-instruct/chat/completions"
API_KEY = "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"  # Use your actual API key

# Maximum allowable image size (in base64 format)
MAX_IMAGE_SIZE = 180_000

async def process_image_with_llama(image: UploadFile, query: str = None):
    """
    Processes the uploaded image using the Llama 90B Vision API and optional query.

    Args:
        image (UploadFile): The uploaded image file.
        query (str, optional): Additional context or instructions for the model.

    Returns:
        dict: The response from the Llama API.
    """
    try:
        # Read the image file and convert it to Base64
        image_data = await image.read()
        image_b64 = base64.b64encode(image_data).decode()

        # Ensure the base64 string length is valid for the Llama API
        if len(image_b64) > MAX_IMAGE_SIZE:
            raise ValueError("Image is too large. It must be less than 180KB.")

        # Prepare the request payload
        payload = {
            "model": "meta/llama-3.2-90b-vision-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": f"Process this image: {image_b64}"  # Just the base64 string
                }
            ],
            "temperature": 1.00,
            "top_p": 1.00,
            "max_tokens": 512,
            "stream": False
        }

        # Set the authorization header
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Accept": "application/json"
        }

        # Send the request to the NVIDIA API
        response = requests.post(INVOKE_URL, json=payload, headers=headers)

        # Check if the response status code is OK
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Error from NVIDIA API: {response.status_code} - {response.text}")

        # Parse the API response and return the result
        return response.json()

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image with Llama API: {str(e)}")
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
