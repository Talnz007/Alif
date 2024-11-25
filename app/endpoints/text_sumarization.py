from fastapi import FastAPI, HTTPException,APIRouter
from pydantic import BaseModel
from app.core.logging import app_logger
import google.generativeai as genai
import re
from typing import Optional
import os
from dotenv import load_dotenv
from app.core.config import settings
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class TextInput(BaseModel):
    text: str

class SummaryResponse(BaseModel):
    summary: str

class TextSummarizerGemini:
    def __init__(self):
        """
        Initialize the TextSummarizer with Gemini API
        """
        # Configure Gemini API with built-in API key
        genai.configure(api_key=settings.GEMINI_KEY)

        # Configure model parameters
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }

        self.safety_settings = {
            genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        }

        # Initialize the model
        self.model = genai.GenerativeModel(
            model_name="gemini-pro",
            generation_config=self.generation_config,
            safety_settings=self.safety_settings
        )

    def _process_text(self, text: str) -> str:
        """
        Process the input text to convert it into a JSON-compatible single line
        """
        processed_text = re.sub(r'\s+', ' ', text.strip())  # Replace newlines and extra spaces
        processed_text = processed_text.replace('"', '\\"')  # Escape double quotes
        return processed_text

    def _split_text(self, text: str, max_length: int = 2000):
        """
        Split the text into smaller chunks if it exceeds the max length
        """
        words = text.split()
        chunks = []
        current_chunk = []

        for word in words:
            current_chunk.append(word)
            if len(" ".join(current_chunk)) > max_length:
                chunks.append(" ".join(current_chunk[:-1]))
                current_chunk = [word]

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    async def summarize_text(self, text: str) -> str:
        """
        Summarize the input text using the Gemini API
        """
        try:
            # Process the text into chunks if it's too long
            chunks = self._split_text(text)
            summaries = []

            for chunk in chunks:
                processed_text = self._process_text(chunk)
                logger.info("Text processed into JSON-compatible format")

                # Define the prompt for summarization
                prompt = (
                    "Summarize the following text into key points and a crux:\n\n"
                    f"{processed_text}\n\n"
                    "Provide the output in the following format:\n"
                    "Key Points:\n- Point 1\n- Point 2\n- ...\n\n"
                    "Crux:\n- A single concise statement summarizing the text."
                )

                logger.info("Sending processed text to Gemini API for summarization...")

                # Start chat with the Gemini model
                chat = self.model.start_chat(history=[])

                # Send the prompt to Gemini
                response = await chat.send_message_async(prompt)

                summaries.append(response.text)

            # Combine summaries from all chunks
            return "\n".join(summaries)

        except Exception as e:
            logger.error(f"Error during text summarization: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# Instantiate the text summarizer
router = APIRouter()
text_summarizer = TextSummarizerGemini()



@router.post("/test-processing/")
async def test_processing(input_data: TextInput):
    """
    API endpoint for testing text processing
    """
    try:
        processed_text = text_summarizer._process_text(input_data.text)
        return {"processed_text": processed_text}
    except Exception as e:
        logger.error(f"Error during text processing: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during text processing")

@router.post("/summarize/", response_model=SummaryResponse)
async def summarize(input_data: TextInput):
    """
    API endpoint for summarizing text
    """
    try:
        summary = await TextSummarizerGemini.summarize_text(input_data.text)
        return {"summary": summary}
    except Exception as e:
        app_logger.error(f"Error during summarization: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during summarization")

