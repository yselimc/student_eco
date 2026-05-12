import logging
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.routes import auth, buddies, events, health, listings, messages, notes, users

configure_logging(settings.log_level)
logger = logging.getLogger(__name__)

_HTTP_CODE_MAP = {
    400: "BAD_REQUEST",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
}

# Turkish field labels — used by the validation translator to produce specific messages
# like "Şifre en az 8 karakter olmalıdır" instead of the generic "Bu alan en az 8...".
# Keys must match the Pydantic field name; missing keys fall back to "Bu alan".
_FIELD_LABELS_TR: dict[str, str] = {
    "email": "E-posta",
    "password": "Şifre",
    "display_name": "İsim",
    "title": "Başlık",
    "description": "Açıklama",
    "body": "Mesaj",
    "looking_for": "Aradığınız",
    "courses": "Dersler",
    "available_days": "Müsait günler",
    "study_style": "Çalışma tarzı",
    "category": "Kategori",
    "location": "Konum",
    "max_attendees": "Maksimum katılımcı sayısı",
    "university": "Üniversite",
    "department": "Bölüm",
    "starts_at": "Başlangıç zamanı",
    "ends_at": "Bitiş zamanı",
    "instagram": "Instagram",
    "discord": "Discord",
    "telefon": "Telefon",
    "listing_id": "İlan",
    "recipient_id": "Alıcı",
    "status": "Durum",
    "contact_info": "İletişim bilgisi",
}


def _field_path(loc: tuple[Any, ...]) -> str:
    """Drop the leading request-location segment (body/query/path/header/cookie) and
    join the rest with dots. Numeric list indices are kept as-is (e.g. 'items.0.price')."""
    parts = list(loc)
    if parts and parts[0] in ("body", "query", "path", "cookie", "header"):
        parts = parts[1:]
    return ".".join(str(p) for p in parts)


def _last_field_name(loc: tuple[Any, ...]) -> str:
    for part in reversed(loc):
        if isinstance(part, str) and not part.isdigit():
            return part
    return ""


def _translate_error(err: dict[str, Any]) -> str:
    """Map a Pydantic v2 error dict to a user-facing Turkish message."""
    err_type: str = err.get("type", "")
    ctx: dict[str, Any] = err.get("ctx") or {}
    loc: tuple[Any, ...] = err.get("loc", ())
    raw_msg: str = err.get("msg", "")
    field_name = _last_field_name(loc)
    label = _FIELD_LABELS_TR.get(field_name, "Bu alan")

    # EmailStr failures come through as type="value_error" with msg containing
    # "valid email address"; check before the generic value_error branch.
    if "email address" in raw_msg.lower() or "email" in err_type:
        return "Geçerli bir e-posta adresi giriniz"

    # Custom @field_validator raising ValueError — those messages are already Turkish
    # in our schemas. Strip Pydantic's "Value error, " prefix.
    if err_type == "value_error":
        return raw_msg.removeprefix("Value error, ")

    if err_type == "missing":
        return f"{label} alanı zorunludur"

    if err_type == "string_type":
        return f"{label} metin olmalıdır"
    if err_type == "int_type" or err_type == "int_parsing":
        return f"{label} tam sayı olmalıdır"
    if err_type == "float_type" or err_type == "float_parsing":
        return f"{label} sayı olmalıdır"
    if err_type == "bool_type" or err_type == "bool_parsing":
        return f"{label} doğru/yanlış olmalıdır"
    if err_type == "list_type":
        return f"{label} liste olmalıdır"
    if err_type in ("datetime_type", "datetime_parsing", "datetime_from_date_parsing"):
        return f"{label} geçerli bir tarih/saat olmalıdır"

    if err_type == "string_too_short":
        n = ctx.get("min_length")
        if n == 1:
            return f"{label} boş olamaz"
        return f"{label} en az {n} karakter olmalıdır"
    if err_type == "string_too_long":
        return f"{label} en fazla {ctx.get('max_length')} karakter olabilir"

    if err_type == "too_short":
        n = ctx.get("min_length")
        if n == 1:
            return f"{label} en az bir öğe içermelidir"
        return f"{label} en az {n} öğe içermelidir"
    if err_type == "too_long":
        return f"{label} en fazla {ctx.get('max_length')} öğe içerebilir"

    if err_type == "greater_than":
        return f"{label} {ctx.get('gt')}'den büyük olmalıdır"
    if err_type == "greater_than_equal":
        return f"{label} en az {ctx.get('ge')} olmalıdır"
    if err_type == "less_than":
        return f"{label} {ctx.get('lt')}'den küçük olmalıdır"
    if err_type == "less_than_equal":
        return f"{label} en fazla {ctx.get('le')} olabilir"

    if err_type in ("literal_error", "enum"):
        expected = ctx.get("expected") or ", ".join(str(v) for v in ctx.get("permitted") or [])
        return f"{label} şu değerlerden biri olmalıdır: {expected}"

    if err_type in ("uuid_parsing", "uuid_type", "uuid_version"):
        return f"{label} geçerli bir UUID olmalıdır"
    if err_type in ("url_parsing", "url_type", "url_scheme"):
        return f"{label} geçerli bir URL olmalıdır"

    if err_type == "json_invalid":
        return "Geçerli bir JSON gönderilmedi"

    return raw_msg or f"{label} geçersiz"


def create_app() -> FastAPI:
    application = FastAPI(title="Student Ecosystem API", version="0.1.0")

    cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(users.router)
    application.include_router(notes.router)
    application.include_router(listings.router)
    application.include_router(messages.router)
    application.include_router(events.router)
    application.include_router(buddies.router)

    avatars_dir = Path(settings.upload_dir) / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)
    application.mount(
        "/uploads/avatars",
        StaticFiles(directory=str(avatars_dir)),
        name="avatars",
    )

    @application.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.error_code},
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "code": _HTTP_CODE_MAP.get(exc.status_code, "HTTP_ERROR"),
            },
        )

    @application.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {"field": _field_path(err["loc"]), "message": _translate_error(err)}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={"detail": "Doğrulama hatası", "errors": errors},
        )

    logger.info("Student Ecosystem API started in %s mode", settings.env)
    return application


app = create_app()
