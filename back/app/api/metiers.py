from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.limiter import limiter
from app.schemas.onisep import MetierShort, MetierDetail
from app.services import onisep_service

router = APIRouter(prefix="/metiers", tags=["metiers"])


@router.get("", response_model=list[MetierShort])
@limiter.limit("60/minute")
def list_metiers(
    request: Request,
    domaine_id: Optional[int] = Query(None, description="Métiers appartenant à ce domaine"),
    niveau_acces_min: Optional[str] = Query(None, description="Filtrer par niveau d'accès minimum"),
    db: Session = Depends(get_db),
):
    """Liste les métiers avec filtres optionnels."""
    return onisep_service.get_metiers(
        db,
        domaine_id=domaine_id,
        niveau_acces_min=niveau_acces_min,
    )


@router.get("/{metier_id}", response_model=MetierDetail)
@limiter.limit("60/minute")
def get_metier(request: Request, metier_id: str, db: Session = Depends(get_db)):
    """Détail complet d'un métier (pour le panneau de détail)."""
    metier = onisep_service.get_metier_by_id(db, metier_id)
    if not metier:
        raise HTTPException(status_code=404, detail="Métier non trouvé")
    return metier
