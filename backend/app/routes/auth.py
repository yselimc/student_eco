from typing import Annotated

from fastapi import APIRouter, File, UploadFile

from app.core.deps import CurrentUserId, DbSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut, user_out
from app.schemas.users import UserMeUpdate
from app.services.auth import AuthService
from app.services.users import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    user, token = AuthService(db).register(payload)
    return TokenResponse(access_token=token, user=user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    user, token = AuthService(db).login(payload)
    return TokenResponse(access_token=token, user=user_out(user))


@router.get("/me", response_model=UserOut)
def me(user_id: CurrentUserId, db: DbSession) -> UserOut:
    user = AuthService(db).get_user(user_id)
    return user_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(payload: UserMeUpdate, user_id: CurrentUserId, db: DbSession) -> UserOut:
    user = UserService(db).update_me(user_id, payload)
    return user_out(user)


@router.post("/me/avatar", response_model=UserOut)
def upload_avatar(
    user_id: CurrentUserId,
    db: DbSession,
    file: Annotated[UploadFile, File()],
) -> UserOut:
    user = UserService(db).set_avatar(user_id, file)
    return user_out(user)


@router.delete("/me/avatar", response_model=UserOut)
def delete_avatar(user_id: CurrentUserId, db: DbSession) -> UserOut:
    user = UserService(db).clear_avatar(user_id)
    return user_out(user)
