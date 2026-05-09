from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.orm import Session

from app.models.listing import Listing
from app.models.message import Message
from app.models.user import User


@dataclass(frozen=True)
class ConversationRow:
    listing_id: UUID | None
    listing_title: str | None
    listing_status: str | None
    other_user_id: UUID
    other_user_name: str
    last_message_body: str
    last_message_at: datetime
    unread_count: int


class MessageRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def insert(
        self,
        *,
        sender_id: UUID,
        listing_id: UUID,
        recipient_id: UUID,
        body: str,
    ) -> Message:
        msg = Message(
            sender_id=sender_id,
            listing_id=listing_id,
            recipient_id=recipient_id,
            body=body,
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get(self, message_id: UUID) -> Message | None:
        return self.db.execute(
            select(Message).where(Message.id == message_id)
        ).scalar_one_or_none()

    def list_thread(
        self,
        *,
        me_id: UUID,
        other_id: UUID,
        listing_id: UUID | None,
    ) -> list[Message]:
        listing_filter = (
            Message.listing_id == listing_id
            if listing_id is not None
            else Message.listing_id.is_(None)
        )
        rows = self.db.execute(
            select(Message)
            .where(
                listing_filter,
                or_(
                    and_(Message.sender_id == me_id, Message.recipient_id == other_id),
                    and_(Message.sender_id == other_id, Message.recipient_id == me_id),
                ),
            )
            .order_by(Message.created_at.asc())
        ).scalars().all()
        return list(rows)

    def mark_thread_read(
        self,
        *,
        me_id: UUID,
        other_id: UUID,
        listing_id: UUID | None,
    ) -> int:
        listing_filter = (
            Message.listing_id == listing_id
            if listing_id is not None
            else Message.listing_id.is_(None)
        )
        result = self.db.execute(
            update(Message)
            .where(
                listing_filter,
                Message.sender_id == other_id,
                Message.recipient_id == me_id,
                Message.read_at.is_(None),
            )
            .values(read_at=func.now())
        )
        self.db.commit()
        return result.rowcount or 0

    def list_conversations(self, *, user_id: UUID) -> list[ConversationRow]:
        # All messages where I'm involved, newest first.
        rows = list(
            self.db.execute(
                select(Message)
                .where(
                    or_(
                        Message.sender_id == user_id,
                        Message.recipient_id == user_id,
                    )
                )
                .order_by(Message.created_at.desc())
            )
            .scalars()
            .all()
        )

        # Dedupe by (listing_id, other_user_id), keeping the latest message per pair.
        latest_by_pair: dict[tuple[UUID | None, UUID], Message] = {}
        for m in rows:
            other_id = m.recipient_id if m.sender_id == user_id else m.sender_id
            key = (m.listing_id, other_id)
            if key not in latest_by_pair:
                latest_by_pair[key] = m

        if not latest_by_pair:
            return []

        other_user_ids = {other for (_, other) in latest_by_pair.keys()}
        user_rows = list(
            self.db.execute(
                select(User.id, User.display_name).where(User.id.in_(other_user_ids))
            ).all()
        )
        user_names: dict[UUID, str] = {uid: name for uid, name in user_rows}

        listing_ids = {lid for (lid, _) in latest_by_pair.keys() if lid is not None}
        listing_meta: dict[UUID, tuple[str, str]] = {}
        if listing_ids:
            listing_rows = list(
                self.db.execute(
                    select(Listing.id, Listing.title, Listing.status).where(
                        Listing.id.in_(listing_ids)
                    )
                ).all()
            )
            listing_meta = {
                lid: (title, status) for lid, title, status in listing_rows
            }

        unread_rows = list(
            self.db.execute(
                select(
                    Message.listing_id,
                    Message.sender_id,
                    func.count().label("unread_count"),
                )
                .where(
                    Message.recipient_id == user_id,
                    Message.read_at.is_(None),
                )
                .group_by(Message.listing_id, Message.sender_id)
            ).all()
        )
        unread_counts: dict[tuple[UUID | None, UUID], int] = {
            (lid, sender_id): cnt for lid, sender_id, cnt in unread_rows
        }

        items: list[ConversationRow] = []
        for (listing_id, other_id), m in latest_by_pair.items():
            title: str | None = None
            status: str | None = None
            if listing_id is not None:
                meta = listing_meta.get(listing_id)
                if meta is not None:
                    title, status = meta
            items.append(
                ConversationRow(
                    listing_id=listing_id,
                    listing_title=title,
                    listing_status=status,
                    other_user_id=other_id,
                    other_user_name=user_names.get(other_id, ""),
                    last_message_body=m.body,
                    last_message_at=m.created_at,
                    unread_count=unread_counts.get((listing_id, other_id), 0),
                )
            )
        return items
