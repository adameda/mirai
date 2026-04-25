from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.parcoursup import FiltresOut
from app.services import parcoursup_service

router = APIRouter(prefix="/parcoursup", tags=["parcoursup"])


@router.get("/filtres", response_model=FiltresOut)
def get_filtres(db: Session = Depends(get_db)):
    return parcoursup_service.get_filtres(db)


@router.get("/specialites", response_model=list[str])
def get_specialites(filiere_agregee: str = Query(...), db: Session = Depends(get_db)):
    return parcoursup_service.get_specialites_for_agregee(db, filiere_agregee)


@router.get("", response_model=dict)
def search(
    q:               Optional[str] = Query(None),
    filiere_agregee: Optional[str] = Query(None),
    filiere_type:    Optional[str] = Query(None),
    region:          Optional[str] = Query(None),
    selectivite:     Optional[str] = Query(None),
    sort_by:         str           = Query("etablissement"),
    limit:           int           = Query(40, le=100),
    offset:          int           = Query(0),
    db: Session = Depends(get_db),
):
    total, items = parcoursup_service.search_formations(
        db, q=q, filiere_agregee=filiere_agregee, filiere_type=filiere_type,
        region=region, selectivite=selectivite, sort_by=sort_by,
        limit=limit, offset=offset,
    )
    return {"total": total, "items": [i.model_dump() for i in items]}
