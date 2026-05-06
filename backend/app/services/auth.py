from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, UnauthenticatedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def register(self, payload: RegisterRequest) -> tuple[User, str]:
        email = payload.email.lower().strip()
        if self.users.get_by_email(email):
            raise ConflictError("Email already registered")
        user = self.users.create(
            email=email,
            password_hash=hash_password(payload.password),
            display_name=payload.display_name.strip(),
        )
        return user, create_access_token(user.id)

    def login(self, payload: LoginRequest) -> tuple[User, str]:
        email = payload.email.lower().strip()
        user = self.users.get_by_email(email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise UnauthenticatedError("Invalid email or password")
        return user, create_access_token(user.id)

    def get_user(self, user_id: UUID) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        return user
