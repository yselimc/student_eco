from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, Form, Query, UploadFile
from fastapi.responses import FileResponse, Response

from app.core.deps import CurrentUserId, DbSession
from app.repositories.listings import ListingWithMeta
from app.schemas.listings import (
    ListingImageRead,
    ListingListResponse,
    ListingRead,
    ListingStatusUpdate,
)
from app.services.listings import ListingService

router = APIRouter(prefix="/listings", tags=["listings"])


def _to_read(item: ListingWithMeta) -> ListingRead:
    return ListingRead(
        id=item.listing.id,
        seller_id=item.listing.seller_id,
        seller_name=item.seller_name,
        title=item.listing.title,
        description=item.listing.description,
        price=item.listing.price,
        category=item.listing.category,
        status=item.listing.status,
        images=[
            ListingImageRead(id=img.id, display_order=img.display_order)
            for img in item.listing.images
        ],
        created_at=item.listing.created_at,
        updated_at=item.listing.updated_at,
    )


@router.get("", response_model=ListingListResponse)
def list_listings(
    db: DbSession,
    _user_id: CurrentUserId,
    category: Annotated[str | None, Query()] = None,
    status: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ListingListResponse:
    result = ListingService(db).list(
        category=category, status=status, q=q, limit=limit, offset=offset,
    )
    return ListingListResponse(
        items=[_to_read(item) for item in result.items],
        total=result.total,
    )


@router.post("", response_model=ListingRead, status_code=201)
def create_listing(
    db: DbSession,
    user_id: CurrentUserId,
    title: Annotated[str, Form(min_length=1, max_length=200)],
    price: Annotated[int, Form(ge=0)],
    category: Annotated[str, Form(min_length=1, max_length=50)],
    files: Annotated[list[UploadFile], File()],
    description: Annotated[str | None, Form(max_length=2000)] = None,
) -> ListingRead:
    item = ListingService(db).create_with_images(
        seller_id=user_id,
        title=title,
        description=description,
        price=price,
        category=category,
        files=files,
    )
    return _to_read(item)


@router.get("/{listing_id}", response_model=ListingRead)
def get_listing(
    listing_id: UUID, db: DbSession, _user_id: CurrentUserId
) -> ListingRead:
    return _to_read(ListingService(db).get(listing_id))


@router.patch("/{listing_id}/status", response_model=ListingRead)
def update_listing_status(
    listing_id: UUID,
    payload: ListingStatusUpdate,
    db: DbSession,
    user_id: CurrentUserId,
) -> ListingRead:
    item = ListingService(db).update_status(
        listing_id=listing_id,
        status=payload.status,
        requester_id=user_id,
    )
    return _to_read(item)


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: UUID, db: DbSession, user_id: CurrentUserId
) -> Response:
    ListingService(db).delete(listing_id=listing_id, requester_id=user_id)
    return Response(status_code=204)


@router.get("/{listing_id}/images/{image_id}")
def get_listing_image(
    listing_id: UUID,
    image_id: UUID,
    db: DbSession,
    _user_id: CurrentUserId,
) -> FileResponse:
    _image, path = ListingService(db).file_for_image(
        listing_id=listing_id, image_id=image_id,
    )
    media_type = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return FileResponse(path=path, media_type=media_type)
