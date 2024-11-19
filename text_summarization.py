from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import google.generativeai as genai
import re
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        api_key = "AIzaSyB14BFp819sG2hFg-peKfeFc22_t1b7mXc"
        genai.configure(api_key=api_key)
        
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
        Process the input text to convert it into a single line
        Args:
            text (str): Input text
        Returns:
            str: Processed single-line text
        """
        # Remove extra whitespace and newlines
        processed_text = re.sub(r'\s+', ' ', text.strip())
        # Remove any special characters that might cause issues
        processed_text = re.sub(r'[^\w\s.,!?;:-]', '', processed_text)
        return processed_text

    async def summarize_text(self, text: str) -> str:
        """
        Summarize the input text using the Gemini API
        Args:
            text (str): Text to summarize
        Returns:
            str: Summarized text
        """
        try:
            # Process the text into a single line
            processed_text = self._process_text(text)
            logger.info("Text processed into single line format")
            
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
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error during text summarization: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# Initialize FastAPI app
app = FastAPI(
    title="Text Summarizer API",
    description="An API that preprocesses and summarizes text using Google's Gemini AI",
    version="1.0.0"
)

# Create a single instance of the summarizer to be reused
summarizer = TextSummarizerGemini()

@app.post("/summarize/", response_model=SummaryResponse)
async def summarize_text(text_input: TextInput):
    """
    Endpoint to summarize text
    """
    try:
        summary = await summarizer.summarize_text(text_input.text)
        return SummaryResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Optional: Add a health check endpoint
@app.get("/health")
async def health_check():
    """
    Endpoint to check if the API is running
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)