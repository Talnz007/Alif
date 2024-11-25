import whisper
from pathlib import Path

model = None


def get_model():
    global model
    if model is None:
        model = whisper.load_model("base")
    return model


async def process_audio_file(file_path: Path) -> dict:

    model = get_model()
    result = model.transcribe(str(file_path))
    return {"text": result["text"]}