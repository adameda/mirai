from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api import domaines, formations, metiers, auth, users, favoris, classes, chat, parcoursup
from app.core.config import settings
from app.core.database import engine
from app.core.limiter import limiter
from app.models import Base  # importe tous les modèles avant create_all
from sqlalchemy import text


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        migrations = [
            "ALTER TABLE onboarding_answers ADD COLUMN IF NOT EXISTS voie VARCHAR(20)",
            "ALTER TABLE onboarding_answers ADD COLUMN IF NOT EXISTS filiere VARCHAR(20)",
            "ALTER TABLE onboarding_answers ADD COLUMN IF NOT EXISTS specialites JSON",
            "ALTER TABLE onboarding_answers ADD COLUMN IF NOT EXISTS matieres_fortes JSON",
            "ALTER TABLE onboarding_answers ADD COLUMN IF NOT EXISTS matieres_aimees JSON",
            "ALTER TABLE onboarding_answers ADD COLUMN IF NOT EXISTS centres_interet JSON",
            "ALTER TABLE onboarding_answers ADD COLUMN IF NOT EXISTS pression_academique VARCHAR(100)",
        ]
        for migration in migrations:
            conn.execute(text(migration))
        conn.commit()
    yield


app = FastAPI(title="Mirai API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(domaines.router, prefix="/api/v1")
app.include_router(formations.router, prefix="/api/v1")
app.include_router(metiers.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(favoris.router, prefix="/api/v1")
app.include_router(classes.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(parcoursup.router, prefix="/api/v1")
