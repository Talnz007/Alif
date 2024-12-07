import requests

url = "http://127.0.0.1:8000/api/v1/process_image"
files = {"image": open("image.png", "rb")}
params = {"query": "solve this question"}

response = requests.post(url, files=files, data=params)
print(response.json())
