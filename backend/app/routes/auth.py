from fastapi import APIRouter

from app.core.deps import CurrentUserId, DbSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    user, token = AuthService(db).register(payload)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    user, token = AuthService(db).login(payload)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user_id: CurrentUserId, db: DbSession) -> UserOut:
    user = AuthService(db).get_user(user_id)
    return UserOut.model_validate(user)
