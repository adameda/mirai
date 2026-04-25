from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.auth import require_eleve
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.favori import FavoriIn, FavoriOut, FavorisGroupedOut
from app.services import favori_service

router = APIRouter(prefix="/favoris", tags=["favoris"])


@router.get("", response_model=FavorisGroupedOut)
@limiter.limit("30/minute")
def get_favoris(
    request: Request,
    current_user: User = Depends(require_eleve),
    db: Session = Depends(get_db),
):
    """Liste des favoris de l'élève connecté, groupés par type."""
    return favori_service.get_favoris(db, current_user)


@router.post("", response_model=FavoriOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def add_favori(
    request: Request,
    data: FavoriIn,
    current_user: User = Depends(require_eleve),
    db: Session = Depends(get_db),
):
    """Ajouter un favori. Idempotent : renvoie l'existant si déjà présent."""
    return favori_service.add_favori(db, current_user, data)


@router.delete("/{favori_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
def delete_favori(
    request: Request,
    favori_id: int,
    current_user: User = Depends(require_eleve),
    db: Session = Depends(get_db),
):
    """Supprimer un favori. L'élève ne peut supprimer que ses propres favoris."""
    favori_service.delete_favori(db, current_user, favori_id)
