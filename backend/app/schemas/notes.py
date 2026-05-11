from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    author_name: str
    author_avatar_url: str | None
    title: str
    description: str | None
    course_code: str
    semester: str
    file_size_bytes: int
    created_at: datetime


class NoteListResponse(BaseModel):
    items: list[NoteRead]
    total: int
