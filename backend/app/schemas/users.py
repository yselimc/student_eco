from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class UserMeUpdate(BaseModel):
    display_name: str | None = Field(
        default=None,
        max_length=100,
        description="Görünen isim (en fazla 100 karakter; boş gönderilemez)",
    )
    university: str | None = Field(
        default=None,
        max_length=100,
        description="Üniversite (en fazla 100 karakter; temizlemek için null gönderin)",
    )
    department: str | None = Field(
        default=None,
        max_length=100,
        description="Bölüm (en fazla 100 karakter; temizlemek için null gönderin)",
    )

    @field_validator("display_name")
    @classmethod
    def _clean_display_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("İsim boş olamaz")
        return cleaned

    @field_validator("university", "department")
    @classmethod
    def _clean_optional(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned or None

    @model_validator(mode="after")
    def _reject_explicit_null_display_name(self) -> "UserMeUpdate":
        if "display_name" in self.model_fields_set and self.display_name is None:
            raise ValueError("İsim boş bırakılamaz")
        return self


class PublicProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    university: str | None
    department: str | None
    avatar_url: str | None
    created_at: datetime
    notes_count: int
    listings_count: int
    events_organized_count: int
    buddy_profile_id: UUID | None
