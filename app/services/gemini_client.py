from google import genai
from google.genai import types
from app.core.config import settings
from app.core.app_logging import app_logger as logger

# Create client using the API key from settings
client = genai.Client(api_key=settings.GEMINI_KEY)

def call_gemini(prompt: str, model: str = None, config: types.GenerateContentConfig = None) -> str:
    """
    Calls the Google Gemini model using the genai library, returning the raw text response.
    """
    try:
        model_name = model or settings.GEMINI_MODEL_NAME
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config  # pass the config if provided
        )
        return response.text
    except Exception as e:
        logger.error(f"Error calling Gemini: {e}")
        raise Exception("LLM call failed")