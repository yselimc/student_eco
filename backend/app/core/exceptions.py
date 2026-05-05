class AppError(Exception):
    status_code: int = 400
    error_code: str = "app_error"

    def __init__(self, message: str = "") -> None:
        super().__init__(message or self.error_code)


class NotFoundError(AppError):
    status_code = 404
    error_code = "not_found"


class ForbiddenError(AppError):
    status_code = 403
    error_code = "forbidden"


class ConflictError(AppError):
    status_code = 409
    error_code = "conflict"


class ValidationFailedError(AppError):
    status_code = 400
    error_code = "validation_failed"


class UnauthenticatedError(AppError):
    status_code = 401
    error_code = "unauthenticated"
