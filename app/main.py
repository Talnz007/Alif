from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import time
from app.core.config import settings
from app.core.exception import CustomHTTPException
from app.endpoints import auth, Transcription
from app.endpoints.Text_sumarization import router as text_summarizer
from app.endpoints.Text_sumarization import TextSummarizerGemini,TextInput,SummaryResponse
from app.core.app_logging import app_logger
import re
from fastapi import FastAPI
from app.endpoints.final_pdf import router as pdf_router
from app.endpoints.auth import router as auth_router
from app.services.studdy_buddy_service import router as study_router
from app.endpoints.message_buddy import router as message_router


# Initialize FastAPI app
app = FastAPI(
    title="Alif API",  # Set title and version here
    version="1.0.0",
    description="AI-powered study companion API",
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
app.include_router(Transcription.router, prefix=settings.API_V1_STR)
app.include_router(pdf_router, prefix=settings.API_V1_STR)
app.include_router(text_summarizer, prefix=settings.API_V1_STR)

app.include_router(auth_router, prefix=settings.API_V1_STR)

app.include_router(study_router, prefix=settings.API_V1_STR)

app.include_router(message_router, prefix=settings.API_V1_STR)


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
    uvicorn.run(app, host="0.0.0.0", port=8000)
