from __future__ import annotations

from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import AppError

PDF_MAX_BYTES = 10 * 1024 * 1024
PDF_CHUNK_BYTES = 1024 * 1024
PDF_MIME_TYPES = {"application/pdf", "application/x-pdf"}
PDF_MAGIC = b"%PDF-"

IMAGE_MAX_BYTES = 5 * 1024 * 1024
IMAGE_CHUNK_BYTES = 1024 * 1024
IMAGE_MIME_TYPES = {"image/jpeg", "image/png"}
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png")
JPEG_MAGIC = b"\xFF\xD8\xFF"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_CHUNK_BYTES = 512 * 1024
AVATAR_MIME_TYPES = {"image/jpeg", "image/png"}
AVATAR_EXTENSIONS = (".jpg", ".jpeg", ".png")


class UnsupportedMediaTypeError(AppError):
    status_code = 415
    error_code = "UNSUPPORTED_MEDIA_TYPE"
    default_message = "Desteklenmeyen dosya türü"


class PayloadTooLargeError(AppError):
    status_code = 413
    error_code = "PAYLOAD_TOO_LARGE"
    default_message = "Dosya çok büyük"


def save_pdf(file: UploadFile, subdir: str = "notes") -> tuple[str, int]:
    """Stream an uploaded PDF to <upload_dir>/<subdir>/<uuid>.pdf.

    Returns the relative path stored on the row and the file size in bytes.
    Validates MIME, extension, magic bytes (first chunk), and size cap.
    """
    if file.content_type not in PDF_MIME_TYPES:
        raise UnsupportedMediaTypeError("Only PDF uploads are accepted")

    original_name = (file.filename or "").lower()
    if not original_name.endswith(".pdf"):
        raise UnsupportedMediaTypeError("File must have a .pdf extension")

    target_dir = Path(settings.upload_dir) / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    relative_path = f"{subdir}/{uuid4().hex}.pdf"
    target_path = Path(settings.upload_dir) / relative_path

    total = 0
    saw_magic = False
    try:
        with target_path.open("wb") as out:
            while chunk := file.file.read(PDF_CHUNK_BYTES):
                if not saw_magic:
                    if not chunk.startswith(PDF_MAGIC):
                        raise UnsupportedMediaTypeError("File does not look like a PDF")
                    saw_magic = True
                total += len(chunk)
                if total > PDF_MAX_BYTES:
                    raise PayloadTooLargeError("PDF exceeds 10 MB limit")
                out.write(chunk)
    except AppError:
        target_path.unlink(missing_ok=True)
        raise
    except Exception:
        target_path.unlink(missing_ok=True)
        raise

    if total == 0:
        target_path.unlink(missing_ok=True)
        raise UnsupportedMediaTypeError("Empty file")

    return relative_path, total


def save_image(file: UploadFile, listing_id: UUID | str) -> tuple[str, int]:
    """Stream an uploaded image to <upload_dir>/listings/<listing_id>/<uuid>.<ext>.

    Returns the relative path stored on the row and the file size in bytes.
    Validates MIME, extension, magic bytes (first chunk), and size cap.
    """
    if file.content_type not in IMAGE_MIME_TYPES:
        raise UnsupportedMediaTypeError("Only JPG and PNG images are accepted")

    original_name = (file.filename or "").lower()
    if not original_name.endswith(IMAGE_EXTENSIONS):
        raise UnsupportedMediaTypeError("Image must have a .jpg, .jpeg, or .png extension")

    extension = ".jpg" if file.content_type == "image/jpeg" else ".png"
    expected_magic = JPEG_MAGIC if file.content_type == "image/jpeg" else PNG_MAGIC

    listing_subdir = f"listings/{listing_id}"
    target_dir = Path(settings.upload_dir) / listing_subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    relative_path = f"{listing_subdir}/{uuid4().hex}{extension}"
    target_path = Path(settings.upload_dir) / relative_path

    total = 0
    saw_magic = False
    try:
        with target_path.open("wb") as out:
            while chunk := file.file.read(IMAGE_CHUNK_BYTES):
                if not saw_magic:
                    if not chunk.startswith(expected_magic):
                        raise UnsupportedMediaTypeError("File does not look like a valid image")
                    saw_magic = True
                total += len(chunk)
                if total > IMAGE_MAX_BYTES:
                    raise PayloadTooLargeError("Image exceeds 5 MB limit")
                out.write(chunk)
    except AppError:
        target_path.unlink(missing_ok=True)
        raise
    except Exception:
        target_path.unlink(missing_ok=True)
        raise

    if total == 0:
        target_path.unlink(missing_ok=True)
        raise UnsupportedMediaTypeError("Empty file")

    return relative_path, total


def save_avatar(file: UploadFile) -> tuple[str, int]:
    """Stream an uploaded avatar to <upload_dir>/avatars/<uuid>.<ext>.

    Returns the relative path stored on the row and the file size in bytes.
    Validates MIME, extension, magic bytes (first chunk), and size cap.
    """
    if file.content_type not in AVATAR_MIME_TYPES:
        raise UnsupportedMediaTypeError("Only JPG and PNG avatars are accepted")

    original_name = (file.filename or "").lower()
    if not original_name.endswith(AVATAR_EXTENSIONS):
        raise UnsupportedMediaTypeError("Avatar must have a .jpg, .jpeg, or .png extension")

    extension = ".jpg" if file.content_type == "image/jpeg" else ".png"
    expected_magic = JPEG_MAGIC if file.content_type == "image/jpeg" else PNG_MAGIC

    target_dir = Path(settings.upload_dir) / "avatars"
    target_dir.mkdir(parents=True, exist_ok=True)
    relative_path = f"avatars/{uuid4().hex}{extension}"
    target_path = Path(settings.upload_dir) / relative_path

    total = 0
    saw_magic = False
    try:
        with target_path.open("wb") as out:
            while chunk := file.file.read(AVATAR_CHUNK_BYTES):
                if not saw_magic:
                    if not chunk.startswith(expected_magic):
                        raise UnsupportedMediaTypeError("File does not look like a valid image")
                    saw_magic = True
                total += len(chunk)
                if total > AVATAR_MAX_BYTES:
                    raise PayloadTooLargeError("Avatar exceeds 2 MB limit")
                out.write(chunk)
    except AppError:
        target_path.unlink(missing_ok=True)
        raise
    except Exception:
        target_path.unlink(missing_ok=True)
        raise

    if total == 0:
        target_path.unlink(missing_ok=True)
        raise UnsupportedMediaTypeError("Empty file")

    return relative_path, total


def delete_avatar_file(relative_path: str) -> None:
    """Remove an avatar file from disk. Silent on missing file."""
    if not relative_path:
        return
    abs_path = Path(settings.upload_dir) / relative_path
    abs_path.unlink(missing_ok=True)


def avatar_url_from_path(relative_path: str | None) -> str | None:
    """Convert a stored avatar relative path to a public URL path."""
    if not relative_path:
        return None
    return f"/uploads/{relative_path}"


def absolute_upload_path(relative_path: str) -> Path:
    return Path(settings.upload_dir) / relative_path
