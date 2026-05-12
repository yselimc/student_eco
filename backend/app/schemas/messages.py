from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    listing_id: UUID = Field(description="Mesajın ait olduğu ilan ID'si")
    recipient_id: UUID = Field(description="Alıcı kullanıcının ID'si")
    body: str = Field(
        min_length=1,
        max_length=5000,
        description="Mesaj içeriği (en az 1, en fazla 5000 karakter)",
    )


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID | None
    sender_id: UUID
    recipient_id: UUID
    body: str
    read_at: datetime | None
    created_at: datetime


class MessageThreadResponse(BaseModel):
    items: list[MessageRead]


class ConversationItem(BaseModel):
    listing_id: UUID | None
    listing_title: str | None
    listing_status: str | None
    other_user_id: UUID
    other_user_name: str
    last_message_body: str
    last_message_at: datetime
    unread_count: int


class ConversationListResponse(BaseModel):
    items: list[ConversationItem]
