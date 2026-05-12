from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


STUDY_STYLES: tuple[str, ...] = ("quiet", "group", "cafe")
StudyStyle = Literal["quiet", "group", "cafe"]

WEEKDAYS: tuple[str, ...] = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)
Weekday = Literal[
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


class ContactInfoWrite(BaseModel):
    instagram: str | None = None
    discord: str | None = None
    telefon: str | None = None

    @field_validator("instagram")
    @classmethod
    def _normalize_instagram(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip().lstrip("@").strip()
        return cleaned or None

    @field_validator("discord")
    @classmethod
    def _normalize_discord(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned or None

    @field_validator("telefon")
    @classmethod
    def _normalize_telefon(cls, v: str | None) -> str | None:
        if v is None:
            return None
        digits = "".join(ch for ch in v if ch.isdigit())
        return digits or None


class ContactInfoRead(BaseModel):
    instagram: str | None = None
    discord: str | None = None
    telefon: str | None = None


class BuddyProfileWrite(BaseModel):
    looking_for: str = Field(
        min_length=10,
        max_length=500,
        description="Ne tür bir çalışma arkadaşı aradığınız (en az 10 karakter)",
    )
    courses: list[str] = Field(
        min_length=1,
        max_length=20,
        description="Çalıştığınız dersler (en az 1, en fazla 20)",
    )
    available_days: list[Weekday] = Field(
        min_length=1,
        max_length=7,
        description="Müsait olduğunuz günler",
    )
    study_style: StudyStyle = Field(description="Çalışma tarzı: quiet, group veya cafe")
    contact_info: ContactInfoWrite

    @field_validator("looking_for")
    @classmethod
    def _strip_looking_for(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 10:
            raise ValueError("Aradığınız açıklama en az 10 karakter olmalıdır")
        return stripped

    @field_validator("courses")
    @classmethod
    def _normalize_courses(cls, v: list[str]) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for raw in v:
            cleaned = raw.strip()
            if not cleaned:
                continue
            key = cleaned.lower()
            if key in seen:
                continue
            seen.add(key)
            result.append(cleaned)
        if not result:
            raise ValueError("Dersler en az bir geçerli değer içermelidir")
        return result

    @field_validator("available_days")
    @classmethod
    def _dedupe_days(cls, v: list[str]) -> list[str]:
        order = {d: i for i, d in enumerate(WEEKDAYS)}
        unique = list({d: None for d in v}.keys())
        unique.sort(key=lambda d: order[d])
        return unique


class BuddyProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    display_name: str
    looking_for: str
    courses: list[str]
    available_days: list[str]
    study_style: StudyStyle
    contact_info: ContactInfoRead
    created_at: datetime
    updated_at: datetime


class BuddyListResponse(BaseModel):
    items: list[BuddyProfileRead]
    total: int
