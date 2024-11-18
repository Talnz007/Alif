from fastapi import FastAPI
from app.endpoints.Transcription import router as transcribe_router

app = FastAPI()

# Register the transcription router
app.include_router(transcribe_router)


@app.get("/")
async def root():
    return {"status": "App is running"}
