from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BuddyProfile(Base):
    __tablename__ = "buddy_profiles"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    looking_for: Mapped[str] = mapped_column(String(500), nullable=False)
    courses: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    available_days: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    study_style: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    contact_info: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        CheckConstraint(
            "study_style IN ('quiet', 'group', 'cafe')",
            name="ck_buddy_profiles_study_style_valid",
        ),
        CheckConstraint(
            "COALESCE(array_length(courses, 1), 0) >= 1",
            name="ck_buddy_profiles_courses_nonempty",
        ),
        CheckConstraint(
            "COALESCE(array_length(available_days, 1), 0) >= 1",
            name="ck_buddy_profiles_available_days_nonempty",
        ),
        CheckConstraint(
            "char_length(looking_for) >= 10",
            name="ck_buddy_profiles_looking_for_min_length",
        ),
        CheckConstraint(
            "(contact_info->>'instagram') IS NOT NULL"
            " OR (contact_info->>'discord') IS NOT NULL"
            " OR (contact_info->>'telefon') IS NOT NULL",
            name="ck_buddy_profiles_contact_info_at_least_one",
        ),
        Index(
            "ix_buddy_profiles_courses_gin",
            "courses",
            postgresql_using="gin",
        ),
        Index(
            "ix_buddy_profiles_available_days_gin",
            "available_days",
            postgresql_using="gin",
        ),
    )
