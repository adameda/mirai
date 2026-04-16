from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.onisep import DomaineOut
from app.services import onisep_service

router = APIRouter(prefix="/domaines", tags=["domaines"])


@router.get("", response_model=list[DomaineOut])
def list_domaines(db: Session = Depends(get_db)):
    """Liste tous les macro-domaines Mirai avec le nombre de formations associées."""
    return onisep_service.get_all_domaines(db)
