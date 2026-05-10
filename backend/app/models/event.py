from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.event_attendee import EventAttendee


class Event(Base):
    __tablename__ = "events"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    organizer_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    attendees: Mapped[list[EventAttendee]] = relationship(
        "EventAttendee",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="EventAttendee.created_at",
    )

    __table_args__ = (
        CheckConstraint(
            "category IN ('academic', 'social', 'sports', 'culture', 'other')",
            name="ck_events_category_valid",
        ),
        CheckConstraint(
            "ends_at IS NULL OR ends_at >= starts_at",
            name="ck_events_ends_after_starts",
        ),
        Index("ix_events_category_starts_at", "category", "starts_at"),
    )
