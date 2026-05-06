from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    env: str = "dev"
    log_level: str = "INFO"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    cors_origins: str = "http://localhost:3000"

    upload_dir: str = "./uploads"

    database_url: str


settings = Settings()
