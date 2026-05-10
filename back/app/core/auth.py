"""
Utilitaires JWT et dépendance FastAPI pour récupérer l'utilisateur connecté.
"""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer()


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role, "typ": "access", "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "role": role, "typ": "refresh", "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("typ") != "refresh":
            raise ValueError("pas un refresh token")
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            raise ValueError("claims manquants")
        return {"user_id": int(user_id), "role": role}
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalide ou expiré",
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dépendance FastAPI. Décode le JWT et retourne l'utilisateur en base.
    Lève une 401 si le token est invalide ou expiré.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("sub manquant")
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user


def require_prof(current_user: User = Depends(get_current_user)) -> User:
    """Dépendance qui vérifie que l'utilisateur connecté est un professeur."""
    if current_user.role != "prof":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux professeurs")
    return current_user


def require_eleve(current_user: User = Depends(get_current_user)) -> User:
    """Dépendance qui vérifie que l'utilisateur connecté est un élève."""
    if current_user.role != "eleve":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux élèves")
    return current_user
