from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models.buddy_profile import BuddyProfile
from app.models.user import User


@dataclass(frozen=True)
class BuddyWithUser:
    profile: BuddyProfile
    display_name: str


@dataclass(frozen=True)
class BuddyListResult:
    items: list[BuddyWithUser]
    total: int


class BuddyRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: UUID) -> BuddyWithUser | None:
        row = self.db.execute(
            select(BuddyProfile, User.display_name)
            .join(User, User.id == BuddyProfile.user_id)
            .where(BuddyProfile.user_id == user_id)
        ).first()
        if row is None:
            return None
        return BuddyWithUser(profile=row[0], display_name=row[1])

    def upsert(
        self,
        *,
        user_id: UUID,
        looking_for: str,
        courses: list[str],
        available_days: list[str],
        study_style: str,
        contact_info: dict,
    ) -> tuple[BuddyProfile, bool]:
        existing = self.db.execute(
            select(BuddyProfile).where(BuddyProfile.user_id == user_id)
        ).scalar_one_or_none()
        created = existing is None
        if existing is None:
            profile = BuddyProfile(
                user_id=user_id,
                looking_for=looking_for,
                courses=courses,
                available_days=available_days,
                study_style=study_style,
                contact_info=contact_info,
            )
            self.db.add(profile)
        else:
            existing.looking_for = looking_for
            existing.courses = courses
            existing.available_days = available_days
            existing.study_style = study_style
            existing.contact_info = contact_info
            profile = existing
        self.db.commit()
        self.db.refresh(profile)
        return profile, created

    def delete(self, user_id: UUID) -> bool:
        profile = self.db.execute(
            select(BuddyProfile).where(BuddyProfile.user_id == user_id)
        ).scalar_one_or_none()
        if profile is None:
            return False
        self.db.delete(profile)
        self.db.commit()
        return True

    def search(
        self,
        *,
        course: str | None,
        day: str | None,
        study_style: str | None,
        exclude_user_id: UUID,
        limit: int,
        offset: int,
    ) -> BuddyListResult:
        filters = [BuddyProfile.user_id != exclude_user_id]
        if course:
            filters.append(
                text(
                    "EXISTS (SELECT 1 FROM unnest(buddy_profiles.courses) c"
                    " WHERE c ILIKE :course_pattern)"
                ).bindparams(course_pattern=f"%{course}%")
            )
        if day:
            filters.append(BuddyProfile.available_days.contains([day]))
        if study_style:
            filters.append(BuddyProfile.study_style == study_style)

        count_stmt = select(func.count()).select_from(BuddyProfile).where(*filters)
        total = self.db.execute(count_stmt).scalar_one()

        rows = self.db.execute(
            select(BuddyProfile, User.display_name)
            .join(User, User.id == BuddyProfile.user_id)
            .where(*filters)
            .order_by(BuddyProfile.updated_at.desc())
            .limit(limit)
            .offset(offset)
        ).all()
        items = [BuddyWithUser(profile=r[0], display_name=r[1]) for r in rows]
        return BuddyListResult(items=items, total=total)
