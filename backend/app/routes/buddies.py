from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response

from app.core.deps import CurrentUserId, DbSession
from app.repositories.buddies import BuddyWithUser
from app.schemas.buddies import (
    BuddyListResponse,
    BuddyProfileRead,
    BuddyProfileWrite,
    ContactInfoRead,
)
from app.services.buddies import BuddyService

router = APIRouter(prefix="/buddies", tags=["buddies"])


def _to_read(item: BuddyWithUser) -> BuddyProfileRead:
    profile = item.profile
    return BuddyProfileRead(
        id=profile.id,
        user_id=profile.user_id,
        display_name=item.display_name,
        looking_for=profile.looking_for,
        courses=list(profile.courses),
        available_days=list(profile.available_days),
        study_style=profile.study_style,
        contact_info=ContactInfoRead(**(profile.contact_info or {})),
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("/me", response_model=BuddyProfileRead)
def get_me(db: DbSession, user_id: CurrentUserId) -> BuddyProfileRead:
    return _to_read(BuddyService(db).get_me(user_id))


@router.put("/me", response_model=BuddyProfileRead)
def upsert_me(
    payload: BuddyProfileWrite,
    db: DbSession,
    user_id: CurrentUserId,
    response: Response,
) -> BuddyProfileRead:
    item, created = BuddyService(db).upsert_me(user_id=user_id, payload=payload)
    response.status_code = 201 if created else 200
    return _to_read(item)


@router.delete("/me", status_code=204)
def delete_me(db: DbSession, user_id: CurrentUserId) -> Response:
    BuddyService(db).delete_me(user_id)
    return Response(status_code=204)


@router.get("", response_model=BuddyListResponse)
def search_buddies(
    db: DbSession,
    user_id: CurrentUserId,
    course: Annotated[str | None, Query(max_length=100)] = None,
    day: Annotated[str | None, Query()] = None,
    study_style: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> BuddyListResponse:
    result = BuddyService(db).search(
        requester_id=user_id,
        course=course,
        day=day,
        study_style=study_style,
        limit=limit,
        offset=offset,
    )
    return BuddyListResponse(
        items=[_to_read(item) for item in result.items],
        total=result.total,
    )


@router.get("/{target_user_id}", response_model=BuddyProfileRead)
def get_by_user_id(
    target_user_id: UUID, db: DbSession, _user_id: CurrentUserId
) -> BuddyProfileRead:
    return _to_read(BuddyService(db).get_by_user_id(target_user_id))
