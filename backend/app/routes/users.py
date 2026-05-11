from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.deps import DbSession, get_current_user_id
from app.schemas.users import PublicProfileRead
from app.services.users import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/{user_id}/profile",
    response_model=PublicProfileRead,
    dependencies=[Depends(get_current_user_id)],
)
def get_public_profile(user_id: UUID, db: DbSession) -> PublicProfileRead:
    return UserService(db).get_public_profile(user_id)
