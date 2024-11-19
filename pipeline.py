import re


def clean_text(text: str) -> str:
    # Lowercase the text
    text = text.lower()

    # Remove punctuation and digits
    text = re.sub(r'[^\w\s]', '', text)

    # Remove extra spaces and newlines
    text = re.sub(r'\s+', ' ', text).strip()

    return text

import secrets
print(secrets.token_hex(32))