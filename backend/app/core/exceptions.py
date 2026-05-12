class AppError(Exception):
    status_code: int = 400
    error_code: str = "APP_ERROR"
    default_message: str = "Bir hata oluştu"

    def __init__(self, message: str = "") -> None:
        self.message = message or self.default_message
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"
    default_message = "Kayıt bulunamadı"


class ForbiddenError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"
    default_message = "Bu işlem için yetkiniz yok"


class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"
    default_message = "Bu işlem mevcut durumla çakışıyor"


class ValidationFailedError(AppError):
    status_code = 400
    error_code = "VALIDATION_ERROR"
    default_message = "Geçersiz veri"


class UnauthenticatedError(AppError):
    status_code = 401
    error_code = "UNAUTHENTICATED"
    default_message = "Kimlik doğrulanmadı"
