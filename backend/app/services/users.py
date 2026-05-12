from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.users import PublicProfileRead, UserMeUpdate
from app.storage.uploaders import (
    avatar_url_from_path,
    delete_avatar_file,
    save_avatar,
)


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def update_me(self, user_id: UUID, payload: UserMeUpdate) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("Kullanıcı bulunamadı")
        fields = payload.model_dump(exclude_unset=True)
        if not fields:
            return user
        return self.users.update_fields(user, fields)

    def set_avatar(self, user_id: UUID, file: UploadFile) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("Kullanıcı bulunamadı")
        old_path = user.avatar_path
        new_path, _size = save_avatar(file)
        try:
            self.users.update_fields(user, {"avatar_path": new_path})
        except Exception:
            delete_avatar_file(new_path)
            raise
        if old_path and old_path != new_path:
            delete_avatar_file(old_path)
        return user

    def clear_avatar(self, user_id: UUID) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("Kullanıcı bulunamadı")
        old_path = user.avatar_path
        if old_path:
            self.users.update_fields(user, {"avatar_path": None})
            delete_avatar_file(old_path)
        return user

    def get_public_profile(self, user_id: UUID) -> PublicProfileRead:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("Kullanıcı bulunamadı")
        return PublicProfileRead(
            id=user.id,
            display_name=user.display_name,
            university=user.university,
            department=user.department,
            avatar_url=avatar_url_from_path(user.avatar_path),
            created_at=user.created_at,
            notes_count=self.users.count_notes(user_id),
            listings_count=self.users.count_active_listings(user_id),
            events_organized_count=self.users.count_organized_events(user_id),
            buddy_profile_id=self.users.get_buddy_profile_id(user_id),
        )
