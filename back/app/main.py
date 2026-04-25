from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import domaines, formations, metiers, auth, users, favoris, classes, chat, parcoursup
from app.core.config import settings
from app.core.database import engine
from app.core.limiter import limiter
from app.models import Base  # importe tous les modèles avant create_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Mirai API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
