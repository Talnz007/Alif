import asyncio
import websockets
import sounddevice as sd
import numpy as np

async def send_audio():
    uri = "ws://127.0.0.1:8000/ws/transcribe"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connection successful!")
            # Send audio data (replace with your actual logic to send audio)
            while True:
                data = await websocket.recv()  # Receive from server
                print(data)  # Just printing the data for now

    except asyncio.TimeoutError:
        print("Connection timed out")
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(send_audio())