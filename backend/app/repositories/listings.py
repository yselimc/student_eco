from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.listing import Listing
from app.models.listing_image import ListingImage
from app.models.user import User


@dataclass(frozen=True)
class ListingWithMeta:
    listing: Listing
    seller_name: str


@dataclass(frozen=True)
class ListingListResult:
    items: list[ListingWithMeta]
    total: int


class ListingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        category: str | None,
        status: str | None,
        q: str | None,
        limit: int,
        offset: int,
    ) -> ListingListResult:
        filters = []
        if category:
            filters.append(Listing.category == category)
        if status:
            filters.append(Listing.status == status)
        if q:
            filters.append(Listing.title.ilike(f"%{q}%"))

        count_stmt = select(func.count()).select_from(Listing)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = self.db.execute(count_stmt).scalar_one()

        stmt = (
            select(Listing, User.display_name)
            .join(User, User.id == Listing.seller_id)
            .options(selectinload(Listing.images))
            .order_by(Listing.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if filters:
            stmt = stmt.where(*filters)

        rows = self.db.execute(stmt).all()
        items = [ListingWithMeta(listing=row[0], seller_name=row[1]) for row in rows]
        return ListingListResult(items=items, total=total)

    def get(self, listing_id: UUID) -> ListingWithMeta | None:
        row = self.db.execute(
            select(Listing, User.display_name)
            .join(User, User.id == Listing.seller_id)
            .options(selectinload(Listing.images))
            .where(Listing.id == listing_id)
        ).first()
        if row is None:
            return None
        return ListingWithMeta(listing=row[0], seller_name=row[1])

    def get_image(self, image_id: UUID) -> ListingImage | None:
        return self.db.execute(
            select(ListingImage).where(ListingImage.id == image_id)
        ).scalar_one_or_none()
