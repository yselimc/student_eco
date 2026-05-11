from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.users import PublicProfileRead, UserMeUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def update_me(self, user_id: UUID, payload: UserMeUpdate) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        fields = payload.model_dump(exclude_unset=True)
        if not fields:
            return user
        return self.users.update_fields(user, fields)

    def get_public_profile(self, user_id: UUID) -> PublicProfileRead:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        return PublicProfileRead(
            id=user.id,
            display_name=user.display_name,
            university=user.university,
            department=user.department,
            created_at=user.created_at,
            notes_count=self.users.count_notes(user_id),
            listings_count=self.users.count_active_listings(user_id),
            events_organized_count=self.users.count_organized_events(user_id),
            buddy_profile_id=self.users.get_buddy_profile_id(user_id),
        )
