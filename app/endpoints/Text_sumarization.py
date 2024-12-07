from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import re
import logging
from app.core.config import settings

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Define the input and response models
class TextInput(BaseModel):
    text: str

class SummaryResponse(BaseModel):
    summary: str

class TextSummarizerGemini:
    def __init__(self):
        # Initialize Gemini API client
        genai.configure(api_key=settings.GEMINI_KEY)
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

        self.model = genai.GenerativeModel(
            model_name="gemini-pro",
            generation_config=self.generation_config,
            safety_settings=self.safety_settings
        )

    def _process_text(self, text: str) -> str:
        processed_text = re.sub(r'\s+', ' ', text.strip())
        processed_text = processed_text.replace('"', '\\"')  # Escape double quotes
        return processed_text

    def _split_text(self, text: str, max_length: int = 2000):
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
        try:
            chunks = self._split_text(text)
            summaries = []
            for chunk in chunks:
                processed_text = self._process_text(chunk)
                prompt = (
                    "Summarize the following text into key points and a crux:\n\n"
                    f"{processed_text}\n\n"
                    "Provide the output in the following format:\n"
                    "Key Points:\n- Point 1\n- Point 2\n- ...\n\n"
                    "Crux:\n- A single concise statement summarizing the text."
                )

                chat = self.model.start_chat(history=[])
                response = await chat.send_message_async(prompt)
                summaries.append(response.text)

            return "\n".join(summaries)

        except Exception as e:
            logger.error(f"Error during text summarization: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# Instantiate the text summarizer
text_summarizer = TextSummarizerGemini()

# Define API endpoint for summarizing text
@router.post("/summarize/", response_model=SummaryResponse)
async def summarize(input_data: TextInput):
    try:
        summary = await text_summarizer.summarize_text(input_data.text)
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Error during summarization: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during summarization")
