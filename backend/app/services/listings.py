from __future__ import annotations

import shutil
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationFailedError
from app.models.listing import Listing
from app.models.listing_image import ListingImage
from app.repositories.listings import (
    ListingListResult,
    ListingRepository,
    ListingWithMeta,
)
from app.schemas.listings import LISTING_CATEGORIES
from app.storage.uploaders import absolute_upload_path, save_image

MAX_IMAGES_PER_LISTING = 3
ALLOWED_STATUSES = {"active", "sold"}


class ListingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.listings = ListingRepository(db)

    def list(
        self,
        *,
        category: str | None,
        status: str | None,
        q: str | None,
        limit: int,
        offset: int,
    ) -> ListingListResult:
        return self.listings.list(
            category=category,
            status=status,
            q=q,
            limit=limit,
            offset=offset,
        )

    def get(self, listing_id: UUID) -> ListingWithMeta:
        item = self.listings.get(listing_id)
        if item is None:
            raise NotFoundError("Listing not found")
        return item

    def create_with_images(
        self,
        *,
        seller_id: UUID,
        title: str,
        description: str | None,
        price: int,
        category: str,
        files: list[UploadFile],
    ) -> ListingWithMeta:
        if category not in LISTING_CATEGORIES:
            raise ValidationFailedError("Unknown category")
        if price < 0:
            raise ValidationFailedError("Price cannot be negative")
        if len(files) == 0:
            raise ValidationFailedError("At least one image is required")
        if len(files) > MAX_IMAGES_PER_LISTING:
            raise ValidationFailedError(
                f"At most {MAX_IMAGES_PER_LISTING} images per listing"
            )

        listing_id = uuid4()
        listing_dir = absolute_upload_path(f"listings/{listing_id}")

        try:
            listing = Listing(
                id=listing_id,
                seller_id=seller_id,
                title=title.strip(),
                description=description.strip() if description else None,
                price=price,
                category=category,
            )
            self.db.add(listing)
            self.db.flush()

            for index, file in enumerate(files):
                relative_path, _size = save_image(file, listing_id)
                self.db.add(
                    ListingImage(
                        listing_id=listing_id,
                        file_path=relative_path,
                        display_order=index,
                    )
                )
            self.db.commit()
        except Exception:
            self.db.rollback()
            if listing_dir.exists():
                shutil.rmtree(listing_dir, ignore_errors=True)
            raise

        return self.get(listing_id)

    def update_status(
        self,
        *,
        listing_id: UUID,
        status: str,
        requester_id: UUID,
    ) -> ListingWithMeta:
        if status not in ALLOWED_STATUSES:
            raise ValidationFailedError("Invalid status")
        item = self.listings.get(listing_id)
        if item is None:
            raise NotFoundError("Listing not found")
        if item.listing.seller_id != requester_id:
            raise ForbiddenError("Only the seller can update this listing")
        item.listing.status = status
        self.db.commit()
        return self.get(listing_id)

    def delete(self, *, listing_id: UUID, requester_id: UUID) -> None:
        item = self.listings.get(listing_id)
        if item is None:
            raise NotFoundError("Listing not found")
        if item.listing.seller_id != requester_id:
            raise ForbiddenError("Only the seller can delete this listing")
        self.db.delete(item.listing)
        self.db.commit()
        listing_dir = absolute_upload_path(f"listings/{listing_id}")
        if listing_dir.exists():
            shutil.rmtree(listing_dir, ignore_errors=True)

    def file_for_image(
        self, *, listing_id: UUID, image_id: UUID
    ) -> tuple[ListingImage, Path]:
        image = self.listings.get_image(image_id)
        if image is None or image.listing_id != listing_id:
            raise NotFoundError("Image not found")
        path = absolute_upload_path(image.file_path)
        if not path.exists():
            raise NotFoundError("File missing on disk")
        return image, path
