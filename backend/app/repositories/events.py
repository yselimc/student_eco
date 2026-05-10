from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.event_attendee import EventAttendee
from app.models.user import User


@dataclass(frozen=True)
class EventWithMeta:
    event: Event
    organizer_name: str
    attendee_count: int


@dataclass(frozen=True)
class EventListResult:
    items: list[EventWithMeta]
    total: int


@dataclass(frozen=True)
class AttendeeRow:
    user_id: UUID
    display_name: str
    rsvp_at: datetime


class EventRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

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
        filters = []
        if category:
            filters.append(Event.category == category)
        if from_dt is not None:
            filters.append(Event.starts_at >= from_dt)
        if to_dt is not None:
            filters.append(Event.starts_at <= to_dt)
        if q:
            filters.append(Event.title.ilike(f"%{q}%"))

        count_stmt = select(func.count()).select_from(Event)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = self.db.execute(count_stmt).scalar_one()

        attendee_count_subq = (
            select(
                EventAttendee.event_id,
                func.count(EventAttendee.id).label("attendee_count"),
            )
            .group_by(EventAttendee.event_id)
            .subquery()
        )

        stmt = (
            select(
                Event,
                User.display_name,
                func.coalesce(attendee_count_subq.c.attendee_count, 0),
            )
            .join(User, User.id == Event.organizer_id)
            .outerjoin(
                attendee_count_subq, attendee_count_subq.c.event_id == Event.id
            )
            .order_by(Event.starts_at.asc())
            .limit(limit)
            .offset(offset)
        )
        if filters:
            stmt = stmt.where(*filters)

        rows = self.db.execute(stmt).all()
        items = [
            EventWithMeta(event=row[0], organizer_name=row[1], attendee_count=row[2])
            for row in rows
        ]
        return EventListResult(items=items, total=total)

    def get(self, event_id: UUID) -> EventWithMeta | None:
        attendee_count_subq = (
            select(
                EventAttendee.event_id,
                func.count(EventAttendee.id).label("attendee_count"),
            )
            .where(EventAttendee.event_id == event_id)
            .group_by(EventAttendee.event_id)
            .subquery()
        )
        row = self.db.execute(
            select(
                Event,
                User.display_name,
                func.coalesce(attendee_count_subq.c.attendee_count, 0),
            )
            .join(User, User.id == Event.organizer_id)
            .outerjoin(
                attendee_count_subq, attendee_count_subq.c.event_id == Event.id
            )
            .where(Event.id == event_id)
        ).first()
        if row is None:
            return None
        return EventWithMeta(event=row[0], organizer_name=row[1], attendee_count=row[2])

    def get_attendance(
        self, *, event_id: UUID, user_id: UUID
    ) -> EventAttendee | None:
        return self.db.execute(
            select(EventAttendee).where(
                EventAttendee.event_id == event_id,
                EventAttendee.user_id == user_id,
            )
        ).scalar_one_or_none()

    def list_attendees(self, *, event_id: UUID) -> list[AttendeeRow]:
        rows = self.db.execute(
            select(EventAttendee.user_id, User.display_name, EventAttendee.created_at)
            .join(User, User.id == EventAttendee.user_id)
            .where(EventAttendee.event_id == event_id)
            .order_by(EventAttendee.created_at.asc())
        ).all()
        return [
            AttendeeRow(user_id=r[0], display_name=r[1], rsvp_at=r[2]) for r in rows
        ]
