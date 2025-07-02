from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import settings
from app.endpoints.document_context import router as document_context_router
from app.core.exception import CustomHTTPException
from app.endpoints import auth, transcription
from app.endpoints.text_sumarization import router as text_summarizer
from contextlib import asynccontextmanager # Import lifespan manager
import google.generativeai as genai # Import genai
from app.core.app_logging import app_logger
import re


from app.endpoints.final_pdf import router as pdf_router
from app.endpoints.auth import router as auth_router
from app.services.studdy_buddy_service import router as study_router
from app.endpoints.message_buddy import router as message_router
from app.endpoints import chatbot
from app.endpoints.badge_endpoints import router as badge_router
from app.endpoints.assignment_generator import router as assignment_generator_router
from app.endpoints.assignment_solver import router as assignment_solver_router
from app.endpoints.file_summarization import router as file_summarization_router
from app.endpoints.flashcard_generator import router as flashcard_generator_router
from app.endpoints.quiz_generator import router as quiz_generator_router
from app.endpoints.math_solver import router as math_solver_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    app_logger.info("Application startup: Configuring services...")
    if settings.GEMINI_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_KEY)
            app_logger.info("Google Generative AI configured successfully.")
        except Exception as e:
            # Log the exception and decide if the app should crash
            app_logger.exception(f"CRITICAL: Failed to configure Google Generative AI: {e}")
            # Optionally raise an error to prevent startup without API key
            # raise RuntimeError("Failed to configure Gemini API") from e
    else:
        app_logger.error("CRITICAL: GEMINI_KEY not found in settings. Gemini API features WILL fail.")
    yield
    # Code to run on shutdown (if any)
    app_logger.info("Application shutdown.")



# Initialize FastAPI app
app = FastAPI(
    title="Alif API",  # Set title and version here
    version="1.0.0",
    description="AI-powered study companion API",
    lifespan=lifespan
)


def _process_text(text: str) -> str:
    processed_text = re.sub(r'\s+', ' ', text.strip())  # Replace multiple spaces with single space
    processed_text = processed_text.replace("\n", " ")  # Replace newlines with space
    processed_text = processed_text.replace('"', '\\"')  # Escape quotes
    return processed_text



# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Add the port your frontend is being served from
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip middleware for response compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handler for custom HTTP exceptions
@app.exception_handler(CustomHTTPException)
async def custom_exception_handler(request: Request, exc: CustomHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Include routers (with API versioning)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(transcription.router, prefix=settings.API_V1_STR)
app.include_router(pdf_router, prefix=settings.API_V1_STR)
app.include_router(badge_router, prefix=settings.API_V1_STR)
app.include_router(text_summarizer, prefix=settings.API_V1_STR)
app.include_router(study_router, prefix=settings.API_V1_STR)
app.include_router(message_router, prefix=settings.API_V1_STR)
app.include_router(document_context_router, prefix=settings.API_V1_STR, tags=["Document Context"])
app.include_router(assignment_generator_router, prefix=settings.API_V1_STR, tags=["Assignment Generator"])
app.include_router(assignment_solver_router, prefix=settings.API_V1_STR, tags=["Assignment Solver"])
app.include_router(file_summarization_router, prefix=settings.API_V1_STR, tags=["File Summarization"])
app.include_router(flashcard_generator_router, prefix=settings.API_V1_STR, tags=["Flashcard Generator"])
app.include_router(quiz_generator_router, prefix=settings.API_V1_STR, tags=["Quiz Generator"])
app.include_router(math_solver_router, prefix=settings.API_V1_STR, tags=["Math Solver"])

# Mount chatbot last
app.mount("/", chatbot.app, name="chatbot")
# --- End Include NEW routers ---


# Custom OpenAPI schema (optional)
# def custom_openapi():
#     if app.openapi_schema:
#         return app.openapi_schema
#     openapi_schema = get_openapi(
#         title="Alif API",
#         version="1.0.0",
#         description="AI-powered study companion API",
#         routes=app.routes,
#     )
#     app.openapi_schema = openapi_schema
#     return app.openapi_schema
#
# app.openapi = custom_openapi()





# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Root endpoint
@app.get("/")
async def root():
    return {"status": "App is running"}

# Run the app (for local development)
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)