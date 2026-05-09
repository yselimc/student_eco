from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ForbiddenError,
    NotFoundError,
    ValidationFailedError,
)
from app.models.listing import Listing
from app.models.message import Message
from app.models.user import User
from app.repositories.messages import ConversationRow, MessageRepository


class MessageService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.messages = MessageRepository(db)

    def send(
        self,
        *,
        sender_id: UUID,
        listing_id: UUID,
        recipient_id: UUID,
        body: str,
    ) -> Message:
        if recipient_id == sender_id:
            raise ValidationFailedError("Cannot send a message to yourself")
        clean_body = body.strip()
        if not clean_body:
            raise ValidationFailedError("Message body cannot be empty")

        listing = self.db.execute(
            select(Listing).where(Listing.id == listing_id)
        ).scalar_one_or_none()
        if listing is None:
            raise NotFoundError("Listing not found")

        recipient = self.db.execute(
            select(User).where(User.id == recipient_id)
        ).scalar_one_or_none()
        if recipient is None:
            raise NotFoundError("Recipient not found")

        return self.messages.insert(
            sender_id=sender_id,
            listing_id=listing_id,
            recipient_id=recipient_id,
            body=clean_body,
        )

    def list_conversations(self, *, user_id: UUID) -> list[ConversationRow]:
        return self.messages.list_conversations(user_id=user_id)

    def list_thread_and_mark_read(
        self,
        *,
        me_id: UUID,
        other_id: UUID,
        listing_id: UUID | None,
    ) -> list[Message]:
        if me_id == other_id:
            raise ValidationFailedError("Cannot view a thread with yourself")
        self.messages.mark_thread_read(
            me_id=me_id, other_id=other_id, listing_id=listing_id
        )
        return self.messages.list_thread(
            me_id=me_id, other_id=other_id, listing_id=listing_id
        )

    def mark_message_read(
        self, *, message_id: UUID, requester_id: UUID
    ) -> Message:
        msg = self.messages.get(message_id)
        if msg is None:
            raise NotFoundError("Message not found")
        if msg.recipient_id != requester_id:
            raise ForbiddenError("Only the recipient can mark a message as read")
        if msg.read_at is None:
            msg.read_at = datetime.now(tz=timezone.utc)
            self.db.commit()
            self.db.refresh(msg)
        return msg
