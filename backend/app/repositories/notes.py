from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.note import Note
from app.models.user import User


@dataclass(frozen=True)
class NoteListItem:
    note: Note
    author_name: str
    author_avatar_path: str | None


@dataclass(frozen=True)
class NoteListResult:
    items: list[NoteListItem]
    total: int


class NoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        course_code: str | None,
        semester: str | None,
        q: str | None,
        limit: int,
        offset: int,
    ) -> NoteListResult:
        filters = []
        if course_code:
            filters.append(Note.course_code == course_code)
        if semester:
            filters.append(Note.semester == semester)
        if q:
            filters.append(Note.title.ilike(f"%{q}%"))

        count_stmt = select(func.count()).select_from(Note)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = self.db.execute(count_stmt).scalar_one()

        stmt = (
            select(Note, User.display_name, User.avatar_path)
            .join(User, User.id == Note.user_id)
            .order_by(Note.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if filters:
            stmt = stmt.where(*filters)

        rows = self.db.execute(stmt).all()
        items = [
            NoteListItem(note=row[0], author_name=row[1], author_avatar_path=row[2])
            for row in rows
        ]
        return NoteListResult(items=items, total=total)

    def get(self, note_id: UUID) -> NoteListItem | None:
        row = self.db.execute(
            select(Note, User.display_name, User.avatar_path)
            .join(User, User.id == Note.user_id)
            .where(Note.id == note_id)
        ).first()
        if row is None:
            return None
        return NoteListItem(note=row[0], author_name=row[1], author_avatar_path=row[2])

    def create(
        self,
        *,
        user_id: UUID,
        title: str,
        description: str | None,
        course_code: str,
        semester: str,
        file_path: str,
        file_size_bytes: int,
    ) -> Note:
        note = Note(
            user_id=user_id,
            title=title,
            description=description,
            course_code=course_code,
            semester=semester,
            file_path=file_path,
            file_size_bytes=file_size_bytes,
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def delete(self, note: Note) -> None:
        self.db.delete(note)
        self.db.commit()
