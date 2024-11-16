from fastapi import FastAPI, UploadFile, File
import whisper
import os
from fastapi.responses import HTMLResponse
from starlette.responses import RedirectResponse

app = FastAPI()
model = whisper.load_model("base")

@app.get("/root")
async def root():
    return {"status": "Test app running"}

@app.get("/upload", response_class=HTMLResponse)
async def upload_form():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f0f0f5;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                background-color: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                width: 50%;
                text-align: center;
            }
            input[type="file"] {
                margin: 10px 0;
                padding: 5px;
            }
            input[type="submit"] {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            input[type="submit"]:hover {
                background-color: #45a049;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Upload an Audio File</h2>
            <form action="/transcribe-upload" method="post" enctype="multipart/form-data">
                <input type="file" name="file" accept="audio/*"><br><br>
                <input type="submit" value="Upload and Transcribe">
            </form>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.post("/transcribe")
async def transcribe_audio_file(file: UploadFile = File(...)):
    # Save the uploaded file to disk
    file_location = f"temp_uploads/{file.filename}"
    os.makedirs("temp_uploads", exist_ok=True)
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    # Transcribe the audio file
    result = model.transcribe(file_location)

    # Remove the temporary file
    os.remove(file_location)

    # Return the transcription result
    return {"transcription": result['text']}

@app.post("/transcribe-upload")
async def transcribe_upload(file: UploadFile = File(...)):
    # Save the uploaded file to disk
    file_location = f"temp_uploads/{file.filename}"
    os.makedirs("temp_uploads", exist_ok=True)
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    # Transcribe the audio file
    result = model.transcribe(file_location)

    # Remove the temporary file
    os.remove(file_location)

    # Return the transcription result as an HTML response
    return HTMLResponse(content=f"<h2>Transcription Result</h2><p>{result['text']}</p>")

# Run with: uvicorn script_name:app --reload
