from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_prof, get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.classe import ClasseOut, ClasseStatsOut, ClasseConfigIn, ClasseConfigOut
from app.services import classe_service

router = APIRouter(prefix="/classe", tags=["classe"])


@router.get("", response_model=ClasseOut)
def get_classe(
    current_user: User = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """Classe du prof connecté avec la liste des élèves et leur progression."""
    return classe_service.get_classe_me(db, current_user)


@router.get("/stats", response_model=ClasseStatsOut)
def get_classe_stats(
    current_user: User = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """Statistiques agrégées de la classe vs objectifs configurés."""
    return classe_service.get_classe_stats(db, current_user)


@router.get("/config", response_model=ClasseConfigOut)
def get_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Configuration des objectifs de la classe (accessible aux profs et élèves)."""
    return classe_service.get_classe_config(db, current_user)


@router.patch("/config", response_model=ClasseConfigOut)
def update_config(
    data: ClasseConfigIn,
    current_user: User = Depends(require_prof),
    db: Session = Depends(get_db),
):
    """Mettre à jour les objectifs de la classe (remplacement complet)."""
    return classe_service.update_classe_config(db, current_user, data)
