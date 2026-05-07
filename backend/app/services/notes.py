from __future__ import annotations

from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.note import Note
from app.repositories.notes import NoteListItem, NoteListResult, NoteRepository
from app.storage.uploaders import absolute_upload_path, save_pdf


class NoteService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.notes = NoteRepository(db)

    def list(
        self,
        *,
        course_code: str | None,
        semester: str | None,
        q: str | None,
        limit: int,
        offset: int,
    ) -> NoteListResult:
        return self.notes.list(
            course_code=course_code,
            semester=semester,
            q=q,
            limit=limit,
            offset=offset,
        )

    def get(self, note_id: UUID) -> NoteListItem:
        item = self.notes.get(note_id)
        if item is None:
            raise NotFoundError("Note not found")
        return item

    def create(
        self,
        *,
        user_id: UUID,
        title: str,
        description: str | None,
        course_code: str,
        semester: str,
        file: UploadFile,
    ) -> NoteListItem:
        relative_path, size_bytes = save_pdf(file, subdir="notes")
        try:
            note = self.notes.create(
                user_id=user_id,
                title=title.strip(),
                description=description.strip() if description else None,
                course_code=course_code.strip().upper(),
                semester=semester.strip(),
                file_path=relative_path,
                file_size_bytes=size_bytes,
            )
        except Exception:
            absolute_upload_path(relative_path).unlink(missing_ok=True)
            raise
        return self.get(note.id)

    def delete(self, *, note_id: UUID, requester_id: UUID) -> None:
        item = self.notes.get(note_id)
        if item is None:
            raise NotFoundError("Note not found")
        if item.note.user_id != requester_id:
            raise ForbiddenError("Only the uploader can delete this note")
        absolute_path = absolute_upload_path(item.note.file_path)
        self.notes.delete(item.note)
        absolute_path.unlink(missing_ok=True)

    def file_for_download(self, note_id: UUID) -> tuple[Note, Path]:
        item = self.get(note_id)
        path = absolute_upload_path(item.note.file_path)
        if not path.exists():
            raise NotFoundError("File missing on disk")
        return item.note, path
