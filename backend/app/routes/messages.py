from uuid import UUID

from fastapi import APIRouter

from app.core.deps import CurrentUserId, DbSession
from app.repositories.messages import ConversationRow
from app.schemas.messages import (
    ConversationItem,
    ConversationListResponse,
    MessageCreate,
    MessageRead,
    MessageThreadResponse,
)
from app.services.messages import MessageService

router = APIRouter(prefix="/messages", tags=["messages"])


def _row_to_item(row: ConversationRow) -> ConversationItem:
    return ConversationItem(
        listing_id=row.listing_id,
        listing_title=row.listing_title,
        listing_status=row.listing_status,
        other_user_id=row.other_user_id,
        other_user_name=row.other_user_name,
        last_message_body=row.last_message_body,
        last_message_at=row.last_message_at,
        unread_count=row.unread_count,
    )


@router.post("", response_model=MessageRead, status_code=201)
def send_message(
    payload: MessageCreate, db: DbSession, user_id: CurrentUserId
) -> MessageRead:
    msg = MessageService(db).send(
        sender_id=user_id,
        listing_id=payload.listing_id,
        recipient_id=payload.recipient_id,
        body=payload.body,
    )
    return MessageRead.model_validate(msg)


@router.get("/conversations", response_model=ConversationListResponse)
def list_conversations(
    db: DbSession, user_id: CurrentUserId
) -> ConversationListResponse:
    rows = MessageService(db).list_conversations(user_id=user_id)
    return ConversationListResponse(items=[_row_to_item(r) for r in rows])


@router.get(
    "/listings/{listing_id}/with/{other_user_id}",
    response_model=MessageThreadResponse,
)
def get_listing_thread(
    listing_id: UUID,
    other_user_id: UUID,
    db: DbSession,
    user_id: CurrentUserId,
) -> MessageThreadResponse:
    items = MessageService(db).list_thread_and_mark_read(
        me_id=user_id, other_id=other_user_id, listing_id=listing_id
    )
    return MessageThreadResponse(
        items=[MessageRead.model_validate(m) for m in items]
    )


@router.get(
    "/orphans/with/{other_user_id}", response_model=MessageThreadResponse
)
def get_orphan_thread(
    other_user_id: UUID, db: DbSession, user_id: CurrentUserId
) -> MessageThreadResponse:
    items = MessageService(db).list_thread_and_mark_read(
        me_id=user_id, other_id=other_user_id, listing_id=None
    )
    return MessageThreadResponse(
        items=[MessageRead.model_validate(m) for m in items]
    )


@router.patch("/{message_id}/read", response_model=MessageRead)
def mark_message_read(
    message_id: UUID, db: DbSession, user_id: CurrentUserId
) -> MessageRead:
    msg = MessageService(db).mark_message_read(
        message_id=message_id, requester_id=user_id
    )
    return MessageRead.model_validate(msg)
