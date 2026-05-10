from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import Response

from app.core.deps import CurrentUserId, DbSession
from app.repositories.events import EventWithMeta
from app.schemas.events import (
    AttendeeListResponse,
    AttendeeRead,
    EventCreate,
    EventListResponse,
    EventRead,
    RsvpRead,
)
from app.services.events import EventService

router = APIRouter(prefix="/events", tags=["events"])


def _to_read(item: EventWithMeta) -> EventRead:
    return EventRead(
        id=item.event.id,
        organizer_id=item.event.organizer_id,
        organizer_name=item.organizer_name,
        title=item.event.title,
        description=item.event.description,
        category=item.event.category,
        location=item.event.location,
        starts_at=item.event.starts_at,
        ends_at=item.event.ends_at,
        max_attendees=item.event.max_attendees,
        attendee_count=item.attendee_count,
        created_at=item.event.created_at,
        updated_at=item.event.updated_at,
    )


@router.get("", response_model=EventListResponse)
def list_events(
    db: DbSession,
    _user_id: CurrentUserId,
    category: Annotated[str | None, Query()] = None,
    from_: Annotated[datetime | None, Query(alias="from")] = None,
    to: Annotated[datetime | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> EventListResponse:
    result = EventService(db).list(
        category=category,
        from_dt=from_,
        to_dt=to,
        q=q,
        limit=limit,
        offset=offset,
    )
    return EventListResponse(
        items=[_to_read(item) for item in result.items],
        total=result.total,
    )


@router.post("", response_model=EventRead, status_code=201)
def create_event(
    payload: EventCreate,
    db: DbSession,
    user_id: CurrentUserId,
) -> EventRead:
    item = EventService(db).create(
        organizer_id=user_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        max_attendees=payload.max_attendees,
    )
    return _to_read(item)


@router.get("/{event_id}", response_model=EventRead)
def get_event(
    event_id: UUID, db: DbSession, _user_id: CurrentUserId
) -> EventRead:
    return _to_read(EventService(db).get(event_id))


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: UUID, db: DbSession, user_id: CurrentUserId
) -> Response:
    EventService(db).delete(event_id=event_id, requester_id=user_id)
    return Response(status_code=204)


@router.post(
    "/{event_id}/attendees", response_model=RsvpRead, status_code=201
)
def rsvp(
    event_id: UUID, db: DbSession, user_id: CurrentUserId
) -> RsvpRead:
    attendance = EventService(db).rsvp(event_id=event_id, user_id=user_id)
    return RsvpRead(
        event_id=attendance.event_id,
        user_id=attendance.user_id,
        created_at=attendance.created_at,
    )


@router.delete("/{event_id}/attendees/me", status_code=204)
def cancel_rsvp(
    event_id: UUID, db: DbSession, user_id: CurrentUserId
) -> Response:
    EventService(db).cancel_rsvp(event_id=event_id, user_id=user_id)
    return Response(status_code=204)


@router.get("/{event_id}/attendees", response_model=AttendeeListResponse)
def list_attendees(
    event_id: UUID, db: DbSession, _user_id: CurrentUserId
) -> AttendeeListResponse:
    rows = EventService(db).list_attendees(event_id=event_id)
    return AttendeeListResponse(
        items=[
            AttendeeRead(
                user_id=r.user_id,
                display_name=r.display_name,
                rsvp_at=r.rsvp_at,
            )
            for r in rows
        ],
        total=len(rows),
    )
