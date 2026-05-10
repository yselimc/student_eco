from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationFailedError,
)
from app.models.event import Event
from app.models.event_attendee import EventAttendee
from app.repositories.events import (
    AttendeeRow,
    EventListResult,
    EventRepository,
    EventWithMeta,
)
from app.schemas.events import EVENT_CATEGORIES


class EventService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.events = EventRepository(db)

    def list(
        self,
        *,
        category: str | None,
        from_dt: datetime | None,
        to_dt: datetime | None,
        q: str | None,
        limit: int,
        offset: int,
    ) -> EventListResult:
        if category is not None and category not in EVENT_CATEGORIES:
            raise ValidationFailedError("Unknown category")
        if from_dt is not None and to_dt is not None and to_dt < from_dt:
            raise ValidationFailedError("'to' must be on or after 'from'")
        return self.events.list(
            category=category,
            from_dt=from_dt,
            to_dt=to_dt,
            q=q,
            limit=limit,
            offset=offset,
        )

    def get(self, event_id: UUID) -> EventWithMeta:
        item = self.events.get(event_id)
        if item is None:
            raise NotFoundError("Event not found")
        return item

    def create(
        self,
        *,
        organizer_id: UUID,
        title: str,
        description: str | None,
        category: str,
        location: str | None,
        starts_at: datetime,
        ends_at: datetime | None,
    ) -> EventWithMeta:
        if category not in EVENT_CATEGORIES:
            raise ValidationFailedError("Unknown category")
        if ends_at is not None and ends_at < starts_at:
            raise ValidationFailedError("'ends_at' must be on or after 'starts_at'")

        event = Event(
            organizer_id=organizer_id,
            title=title,
            description=description.strip() if description else None,
            category=category,
            location=location.strip() if location else None,
            starts_at=starts_at,
            ends_at=ends_at,
        )
        self.db.add(event)
        self.db.commit()
        return self.get(event.id)

    def delete(self, *, event_id: UUID, requester_id: UUID) -> None:
        item = self.events.get(event_id)
        if item is None:
            raise NotFoundError("Event not found")
        if item.event.organizer_id != requester_id:
            raise ForbiddenError("Only the organizer can delete this event")
        self.db.delete(item.event)
        self.db.commit()

    def rsvp(self, *, event_id: UUID, user_id: UUID) -> EventAttendee:
        item = self.events.get(event_id)
        if item is None:
            raise NotFoundError("Event not found")
        existing = self.events.get_attendance(event_id=event_id, user_id=user_id)
        if existing is not None:
            raise ConflictError("Already RSVPed to this event")
        attendance = EventAttendee(event_id=event_id, user_id=user_id)
        self.db.add(attendance)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("Already RSVPed to this event") from exc
        self.db.refresh(attendance)
        return attendance

    def cancel_rsvp(self, *, event_id: UUID, user_id: UUID) -> None:
        if self.events.get(event_id) is None:
            raise NotFoundError("Event not found")
        existing = self.events.get_attendance(event_id=event_id, user_id=user_id)
        if existing is None:
            raise NotFoundError("RSVP not found")
        self.db.delete(existing)
        self.db.commit()

    def list_attendees(self, *, event_id: UUID) -> list[AttendeeRow]:
        if self.events.get(event_id) is None:
            raise NotFoundError("Event not found")
        return self.events.list_attendees(event_id=event_id)
