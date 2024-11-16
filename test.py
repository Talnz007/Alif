import requests

# Base URL for the FastAPI app
url = 'http://127.0.0.1:8000/transcribe'

# Paths to the .wav files
file_paths = [
    r'C:\Users\Talha.DESKTOP-RFR40N7\Downloads\Compressed\Trump\Trump_WEF_2018.mp3',
]

# Loop through each file and test them
for file_path in file_paths:
    with open(file_path, 'rb') as audio_file:
        response = requests.post(url, files={'file': audio_file})
        print(f"Transcription for {file_path}:\n", response.json())
