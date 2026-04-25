from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_eleve
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.user import UserOut, OnboardingIn, OnboardingOut
from app.services import user_service

router = APIRouter(prefix="/me", tags=["utilisateur"])


@router.get("", response_model=UserOut)
@limiter.limit("30/minute")
def get_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Profil de l'utilisateur connecté."""
    return user_service.get_me(db, current_user)


@router.post("/onboarding", response_model=OnboardingOut)
@limiter.limit("10/minute")
def post_onboarding(
    request: Request,
    data: OnboardingIn,
    current_user: User = Depends(require_eleve),
    db: Session = Depends(get_db),
):
    """Enregistrer les réponses de l'onboarding. Marque l'élève comme onboardé."""
    return user_service.save_onboarding(db, current_user, data)
