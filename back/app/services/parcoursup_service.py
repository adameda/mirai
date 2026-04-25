from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.parcoursup import ParcoursupFormation
from app.schemas.parcoursup import ParcoursupFormationOut, FiltresOut


def get_filtres(db: Session) -> FiltresOut:
    def distinct(col):
        return [r[0] for r in db.query(col).distinct().order_by(col) if r[0]]

    return FiltresOut(
        filieres_agregees = distinct(ParcoursupFormation.filiere_agregee),
        filieres_types    = distinct(ParcoursupFormation.filiere_type),
        regions           = distinct(ParcoursupFormation.region),
        selectivites      = distinct(ParcoursupFormation.selectivite),
    )


def get_specialites_for_agregee(db: Session, filiere_agregee: str) -> list[str]:
    rows = (
        db.query(ParcoursupFormation.filiere_specialite)
        .filter(ParcoursupFormation.filiere_agregee == filiere_agregee)
        .filter(ParcoursupFormation.filiere_specialite != None)
        .distinct()
        .order_by(ParcoursupFormation.filiere_specialite)
        .all()
    )
    return [r[0] for r in rows if r[0]]


def search_formations(
    db: Session,
    q: str | None = None,
    filiere_agregee: str | None = None,
    filiere_type: str | None = None,
    region: str | None = None,
    selectivite: str | None = None,
    sort_by: str = "etablissement",
    limit: int = 40,
    offset: int = 0,
) -> tuple[int, list[ParcoursupFormationOut]]:
    query = db.query(ParcoursupFormation)

    if filiere_agregee:
        query = query.filter(ParcoursupFormation.filiere_agregee == filiere_agregee)
    if filiere_type:
        query = query.filter(ParcoursupFormation.filiere_specialite == filiere_type)
    if region:
        query = query.filter(ParcoursupFormation.region == region)
    if selectivite:
        query = query.filter(ParcoursupFormation.selectivite == selectivite)
    if q:
        term = f"%{q}%"
        query = query.filter(or_(
            ParcoursupFormation.etablissement.ilike(term),
            ParcoursupFormation.filiere_specialite.ilike(term),
            ParcoursupFormation.filiere_detaillee.ilike(term),
            ParcoursupFormation.commune.ilike(term),
        ))

    total = query.count()

    if sort_by == "taux_acces_asc":
        query = query.order_by(ParcoursupFormation.taux_acces.asc().nulls_last())
    elif sort_by == "taux_acces_desc":
        query = query.order_by(ParcoursupFormation.taux_acces.desc().nulls_last())
    elif sort_by == "capacite":
        query = query.order_by(ParcoursupFormation.capacite.desc().nulls_last())
    else:
        query = query.order_by(ParcoursupFormation.etablissement)

    rows = query.offset(offset).limit(limit).all()
    return total, [ParcoursupFormationOut.model_validate(r) for r in rows]
