"""
Module to share state between different FastAPI endpoints/routers
"""
# Shared variables accessible by all modules
vector_db = None
uploaded_file_metadata = []


def get_vector_db():
    global vector_db
    return vector_db


def set_vector_db(db):
    global vector_db
    vector_db = db


def get_uploaded_metadata():
    global uploaded_file_metadata
    return uploaded_file_metadata


def set_uploaded_metadata(metadata):
    global uploaded_file_metadata
    uploaded_file_metadata = metadata


def add_file_metadata(metadata):
    global uploaded_file_metadata
    uploaded_file_metadata.append(metadata)


def clear_all():
    global vector_db, uploaded_file_metadata
    vector_db = None
    uploaded_file_metadata = []