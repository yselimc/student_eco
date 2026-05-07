from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import AppError

PDF_MAX_BYTES = 10 * 1024 * 1024
PDF_CHUNK_BYTES = 1024 * 1024
PDF_MIME_TYPES = {"application/pdf", "application/x-pdf"}
PDF_MAGIC = b"%PDF-"


class UnsupportedMediaTypeError(AppError):
    status_code = 415
    error_code = "unsupported_media_type"


class PayloadTooLargeError(AppError):
    status_code = 413
    error_code = "payload_too_large"


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


def absolute_upload_path(relative_path: str) -> Path:
    return Path(settings.upload_dir) / relative_path
