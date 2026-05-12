from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


EVENT_CATEGORIES: tuple[str, ...] = (
    "academic",
    "social",
    "sports",
    "culture",
    "other",
)

EventCategory = Literal["academic", "social", "sports", "culture", "other"]


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organizer_id: UUID
    organizer_name: str
    organizer_avatar_url: str | None
    title: str
    description: str | None
    category: EventCategory
    location: str | None
    starts_at: datetime
    ends_at: datetime | None
    max_attendees: int | None
    attendee_count: int
    created_at: datetime
    updated_at: datetime


class EventListResponse(BaseModel):
    items: list[EventRead]
    total: int


class EventCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
        description="Etkinlik başlığı (en az 1, en fazla 200 karakter)",
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Etkinlik açıklaması (en fazla 2000 karakter)",
    )
    category: EventCategory = Field(
        description="Kategori: academic, social, sports, culture veya other",
    )
    location: str | None = Field(
        default=None,
        max_length=200,
        description="Etkinlik konumu (en fazla 200 karakter)",
    )
    starts_at: datetime = Field(description="Başlangıç zamanı (UTC ISO 8601)")
    ends_at: datetime | None = Field(default=None, description="Bitiş zamanı (UTC ISO 8601)")
    max_attendees: int | None = Field(
        default=None,
        ge=1,
        description="Maksimum katılımcı sayısı (en az 1; sınırsız için boş bırakın)",
    )

    @field_validator("title")
    @classmethod
    def _strip_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Başlık boş olamaz")
        return stripped


class AttendeeRead(BaseModel):
    user_id: UUID
    display_name: str
    avatar_url: str | None
    rsvp_at: datetime


class AttendeeListResponse(BaseModel):
    items: list[AttendeeRead]
    total: int


class RsvpRead(BaseModel):
    event_id: UUID
    user_id: UUID
    created_at: datetime
