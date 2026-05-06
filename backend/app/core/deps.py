from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthenticatedError
from app.core.security import decode_access_token
from app.db.session import get_db


def get_current_user_id(request: Request) -> UUID:
    auth = request.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise UnauthenticatedError("Missing or invalid Authorization header")
    token = auth.split(" ", 1)[1].strip()
    if not token:
        raise UnauthenticatedError("Missing or invalid Authorization header")
    return decode_access_token(token)


DbSession = Annotated[Session, Depends(get_db)]
CurrentUserId = Annotated[UUID, Depends(get_current_user_id)]
