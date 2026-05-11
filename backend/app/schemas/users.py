from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class UserMeUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    university: str | None = Field(default=None, max_length=100)
    department: str | None = Field(default=None, max_length=100)

    @field_validator("display_name")
    @classmethod
    def _clean_display_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("display_name must not be empty after stripping whitespace")
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
            raise ValueError("display_name cannot be set to null")
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
