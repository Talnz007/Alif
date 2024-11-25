import aiofiles
from pathlib import Path
from fastapi import UploadFile

def save_file_to_disk(file, file_path):
    """Saves an uploaded file to a specified path on disk"""
    with open(file_path, "wb") as buffer:
        buffer.write(file)

def count_words_and_chars(text):
    """Returns the word and character count of the given text"""
    return len(text.split()), len(text)

def reverse_string(text):
    """Returns the reversed version of the input string"""
    return text[::-1]




async def save_file_async(file, directory: Path):
    try:
        directory.mkdir(parents=True, exist_ok=True)
        file_path = directory / file.filename
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        return file_path
    except Exception as e:
        raise Exception(f"Error while saving the file: {str(e)}")