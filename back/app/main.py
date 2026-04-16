from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import domaines, formations, metiers, auth, users, favoris, classes

app = FastAPI(title="Mirai API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # dev Vite
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
