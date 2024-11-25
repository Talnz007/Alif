from typing import Generic, TypeVar, Type
from pydantic import BaseModel
from fastapi.encoders import jsonable_encoder
from app.database.connection import DatabaseConnection

T = TypeVar('T', bound=BaseModel)

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], table_name: str):
        self.model = model
        self.table_name = table_name
        self.db = DatabaseConnection().get_client()

    async def create(self, data: T):
        json_data = jsonable_encoder(data)
        result = self.db.table(self.table_name).insert(json_data).execute()
        return result.data

    async def get_by_id(self, id: int):
        result = self.db.table(self.table_name).select("*").eq("id", id).execute()
        return result.data[0] if result.data else None