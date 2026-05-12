from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationFailedError
from app.repositories.buddies import (
    BuddyListResult,
    BuddyRepository,
    BuddyWithUser,
)
from app.schemas.buddies import BuddyProfileWrite, STUDY_STYLES, WEEKDAYS


class BuddyContactRequiredError(ValidationFailedError):
    status_code = 422
    error_code = "BUDDY_CONTACT_REQUIRED"
    default_message = "En az bir iletişim yöntemi (Instagram, Discord veya telefon) gereklidir"


class BuddyService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.buddies = BuddyRepository(db)

    def get_me(self, user_id: UUID) -> BuddyWithUser:
        item = self.buddies.get_by_user_id(user_id)
        if item is None:
            raise NotFoundError("Buddy profile not found")
        return item

    def get_by_user_id(self, user_id: UUID) -> BuddyWithUser:
        item = self.buddies.get_by_user_id(user_id)
        if item is None:
            raise NotFoundError("Buddy profile not found")
        return item

    def upsert_me(
        self, *, user_id: UUID, payload: BuddyProfileWrite
    ) -> tuple[BuddyWithUser, bool]:
        contact_dict = payload.contact_info.model_dump(exclude_none=True)
        if not contact_dict:
            raise BuddyContactRequiredError(
                "At least one of instagram, discord, telefon is required"
            )
        _, created = self.buddies.upsert(
            user_id=user_id,
            looking_for=payload.looking_for,
            courses=payload.courses,
            available_days=payload.available_days,
            study_style=payload.study_style,
            contact_info=contact_dict,
        )
        item = self.buddies.get_by_user_id(user_id)
        assert item is not None
        return item, created

    def delete_me(self, user_id: UUID) -> None:
        if not self.buddies.delete(user_id):
            raise NotFoundError("Buddy profile not found")

    def search(
        self,
        *,
        requester_id: UUID,
        course: str | None,
        day: str | None,
        study_style: str | None,
        limit: int,
        offset: int,
    ) -> BuddyListResult:
        if day is not None and day not in WEEKDAYS:
            raise ValidationFailedError("Unknown weekday")
        if study_style is not None and study_style not in STUDY_STYLES:
            raise ValidationFailedError("Unknown study_style")
        return self.buddies.search(
            course=course.strip() if course else None,
            day=day,
            study_style=study_style,
            exclude_user_id=requester_id,
            limit=limit,
            offset=offset,
        )
