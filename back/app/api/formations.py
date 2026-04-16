from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.onisep import FormationShort, FormationDetail
from app.services import onisep_service

router = APIRouter(prefix="/formations", tags=["formations"])


@router.get("", response_model=list[FormationShort])
def list_formations(
    domaine_id: Optional[int] = Query(None, description="Filtrer par domaine"),
    type: Optional[str] = Query(None, description="Filtrer par type (BTS, BUT, master...)"),
    niveau_etudes: Optional[str] = Query(None, description="Filtrer par niveau (bac + 2, bac + 3...)"),
    db: Session = Depends(get_db),
):
    """Liste les formations avec filtres optionnels."""
    return onisep_service.get_formations(db, domaine_id=domaine_id, type_sigle=type, niveau_etudes=niveau_etudes)


@router.get("/{formation_id}", response_model=FormationDetail)
def get_formation(formation_id: str, db: Session = Depends(get_db)):
    """Détail complet d'une formation (pour le panneau de détail)."""
    formation = onisep_service.get_formation_by_id(db, formation_id)
    if not formation:
        raise HTTPException(status_code=404, detail="Formation non trouvée")
    return formation
