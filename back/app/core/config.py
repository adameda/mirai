from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://user:password@localhost:5432/mirai"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"
    INVITE_CODE: str = "mirai2026"

    model_config = {"env_file": ".env"}


settings = Settings()
