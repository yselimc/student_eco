from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.buddy_profile import BuddyProfile
from app.models.event import Event
from app.models.listing import Listing
from app.models.note import Note
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    def create(self, *, email: str, password_hash: str, display_name: str) -> User:
        user = User(email=email, password_hash=password_hash, display_name=display_name)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_fields(self, user: User, fields: dict[str, Any]) -> User:
        for key, value in fields.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def count_notes(self, user_id: UUID) -> int:
        return int(
            self.db.execute(
                select(func.count(Note.id)).where(Note.user_id == user_id)
            ).scalar_one()
        )

    def count_active_listings(self, user_id: UUID) -> int:
        return int(
            self.db.execute(
                select(func.count(Listing.id)).where(
                    Listing.seller_id == user_id, Listing.status == "active"
                )
            ).scalar_one()
        )

    def count_organized_events(self, user_id: UUID) -> int:
        return int(
            self.db.execute(
                select(func.count(Event.id)).where(Event.organizer_id == user_id)
            ).scalar_one()
        )

    def get_buddy_profile_id(self, user_id: UUID) -> UUID | None:
        return self.db.execute(
            select(BuddyProfile.id).where(BuddyProfile.user_id == user_id)
        ).scalar_one_or_none()
