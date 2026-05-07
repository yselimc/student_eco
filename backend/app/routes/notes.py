from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, Form, Query, UploadFile
from fastapi.responses import FileResponse, Response

from app.core.deps import CurrentUserId, DbSession
from app.repositories.notes import NoteListItem
from app.schemas.notes import NoteListResponse, NoteRead
from app.services.notes import NoteService

router = APIRouter(prefix="/notes", tags=["notes"])


def _to_read(item: NoteListItem) -> NoteRead:
    return NoteRead(
        id=item.note.id,
        user_id=item.note.user_id,
        author_name=item.author_name,
        title=item.note.title,
        description=item.note.description,
        course_code=item.note.course_code,
        semester=item.note.semester,
        file_size_bytes=item.note.file_size_bytes,
        created_at=item.note.created_at,
    )


@router.get("", response_model=NoteListResponse)
def list_notes(
    db: DbSession,
    _user_id: CurrentUserId,
    course_code: Annotated[str | None, Query()] = None,
    semester: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> NoteListResponse:
    result = NoteService(db).list(
        course_code=course_code,
        semester=semester,
        q=q,
        limit=limit,
        offset=offset,
    )
    return NoteListResponse(
        items=[_to_read(item) for item in result.items],
        total=result.total,
    )


@router.post("", response_model=NoteRead, status_code=201)
def create_note(
    db: DbSession,
    user_id: CurrentUserId,
    title: Annotated[str, Form(min_length=1, max_length=200)],
    course_code: Annotated[str, Form(min_length=1, max_length=50)],
    semester: Annotated[str, Form(min_length=1, max_length=20)],
    file: Annotated[UploadFile, File()],
    description: Annotated[str | None, Form(max_length=2000)] = None,
) -> NoteRead:
    item = NoteService(db).create(
        user_id=user_id,
        title=title,
        description=description,
        course_code=course_code,
        semester=semester,
        file=file,
    )
    return _to_read(item)


@router.get("/{note_id}", response_model=NoteRead)
def get_note(note_id: UUID, db: DbSession, _user_id: CurrentUserId) -> NoteRead:
    return _to_read(NoteService(db).get(note_id))


@router.get("/{note_id}/download")
def download_note(note_id: UUID, db: DbSession, _user_id: CurrentUserId) -> FileResponse:
    note, path = NoteService(db).file_for_download(note_id)
    safe_title = note.title.replace('"', "").strip() or "note"
    filename = f"{safe_title}.pdf"
    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename=filename,
    )


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: UUID, db: DbSession, user_id: CurrentUserId) -> Response:
    NoteService(db).delete(note_id=note_id, requester_id=user_id)
    return Response(status_code=204)
