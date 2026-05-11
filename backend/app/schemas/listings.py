from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


LISTING_CATEGORIES: tuple[str, ...] = (
    "book",
    "electronics",
    "clothing",
    "furniture",
    "other",
)

ListingCategory = Literal["book", "electronics", "clothing", "furniture", "other"]
ListingStatus = Literal["active", "sold"]


class ListingImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_order: int


class ListingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    seller_id: UUID
    seller_name: str
    seller_avatar_url: str | None
    title: str
    description: str | None
    price: int
    category: ListingCategory
    status: ListingStatus
    images: list[ListingImageRead]
    created_at: datetime
    updated_at: datetime


class ListingListResponse(BaseModel):
    items: list[ListingRead]
    total: int


class ListingStatusUpdate(BaseModel):
    status: ListingStatus
