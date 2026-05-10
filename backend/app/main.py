import logging

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.routes import auth, health, listings, messages, notes

configure_logging(settings.log_level)
logger = logging.getLogger(__name__)

_HTTP_CODE_MAP = {
    400: "bad_request",
    401: "unauthenticated",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    413: "payload_too_large",
    415: "unsupported_media_type",
}


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
    application.include_router(notes.router)
    application.include_router(listings.router)
    application.include_router(messages.router)

    @application.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc), "code": exc.error_code},
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "code": _HTTP_CODE_MAP.get(exc.status_code, "http_error"),
            },
        )

    @application.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=jsonable_encoder(
                {
                    "detail": "Validation failed",
                    "code": "validation_failed",
                    "errors": exc.errors(),
                }
            ),
        )

    logger.info("Student Ecosystem API started in %s mode", settings.env)
    return application


app = create_app()
