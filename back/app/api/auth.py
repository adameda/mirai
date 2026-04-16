from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import TokenOut
from app.schemas.user import SignupIn, LoginIn
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenOut, status_code=201)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    """
    Créer un compte.
    - role='eleve' : class_code requis (doit exister)
    - role='prof'  : class_code ignoré, une classe est créée automatiquement
    """
    return user_service.signup(db, data)


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    """Se connecter avec prenom + role + class_code."""
    return user_service.login(db, data)
