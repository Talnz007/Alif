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
