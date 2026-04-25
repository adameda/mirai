from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.auth import require_prof, get_current_user
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.classe import ClasseOut, ClasseStatsOut, ClasseConfigIn, ClasseConfigOut
from app.services import classe_service

router = APIRouter(prefix="/classe", tags=["classe"])


@router.get("", response_model=ClasseOut)
@limiter.limit("30/minute")
def get_classe(
    request: Request,
    current_user: User = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """Classe du prof connecté avec la liste des élèves et leur progression."""
    return classe_service.get_classe_me(db, current_user)


@router.get("/stats", response_model=ClasseStatsOut)
@limiter.limit("30/minute")
def get_classe_stats(
    request: Request,
    current_user: User = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """Statistiques agrégées de la classe vs objectifs configurés."""
    return classe_service.get_classe_stats(db, current_user)


@router.get("/config", response_model=ClasseConfigOut)
@limiter.limit("30/minute")
def get_config(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Configuration des objectifs de la classe (accessible aux profs et élèves)."""
    return classe_service.get_classe_config(db, current_user)


@router.patch("/config", response_model=ClasseConfigOut)
@limiter.limit("30/minute")
def update_config(
    request: Request,
    data: ClasseConfigIn,
    current_user: User = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """Mettre à jour les objectifs de la classe (remplacement complet)."""
    return classe_service.update_classe_config(db, current_user, data)
