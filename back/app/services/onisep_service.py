"""
Couche service pour les données Onisep.
Les fonctions prennent une session SQLAlchemy et retournent des schémas Pydantic.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models.onisep import Domaine, Formation, Metier
from app.schemas.onisep import (
    DomaineOut,
    FormationShort,
    FormationDetail,
    MetierShort,
    MetierDetail,
    TypeFormationOut,
    SecteurOut,
)


# ── Helpers de conversion ─────────────────────────────────────────────────────

def _type_formation(f: Formation) -> TypeFormationOut:
    return TypeFormationOut(
        sigle=f.type_sigle,
        libelle_court=f.type_libelle_court,
        libelle=f.type_libelle,
    )


def _domaines_out(domaines: list[Domaine]) -> list[DomaineOut]:
    return [DomaineOut(id=d.id, libelle=d.libelle, slug=d.slug) for d in domaines]


def _secteurs_out(secteurs_json: list | None) -> list[SecteurOut]:
    if not secteurs_json:
        return []
    return [SecteurOut(id=s["id"], libelle=s["libelle"]) for s in secteurs_json]


def _formation_to_short(f: Formation) -> FormationShort:
    return FormationShort(
        id=f.id,
        libelle_complet=f.libelle_complet,
        libelle_generique=f.libelle_generique,
        type_formation=_type_formation(f),
        duree=f.duree,
        niveau_etudes=f.niveau_etudes,
        domaines=_domaines_out(f.domaines),
        description_courte=f.description_courte,
        acces_postbac_direct=f.acces_postbac_direct,
        url=f.url,
    )


def _formation_to_detail(f: Formation) -> FormationDetail:
    return FormationDetail(
        id=f.id,
        libelle_complet=f.libelle_complet,
        libelle_generique=f.libelle_generique,
        libelle_specifique=f.libelle_specifique,
        type_formation=_type_formation(f),
        duree=f.duree,
        niveau_etudes=f.niveau_etudes,
        niveau_certification=f.niveau_certification,
        domaines=_domaines_out(f.domaines),
        description_courte=f.description_courte,
        acces=f.acces,
        attendus=f.attendus,
        poursuite_etudes=f.poursuite_etudes,
        url=f.url,
    )


def _metier_to_short(m: Metier) -> MetierShort:
    return MetierShort(
        id=m.id,
        nom=m.nom,
        libelle_feminin=m.libelle_feminin,
        libelle_masculin=m.libelle_masculin,
        secteurs_activite=_secteurs_out(m.secteurs_activite),
        niveau_acces_min=m.niveau_acces_min,
        salaire_debutant=m.salaire_debutant,
        accroche=m.accroche,
    )


def _metier_to_detail(m: Metier) -> MetierDetail:
    return MetierDetail(
        id=m.id,
        nom=m.nom,
        libelle_feminin=m.libelle_feminin,
        libelle_masculin=m.libelle_masculin,
        synonymes=m.synonymes or [],
        secteurs_activite=_secteurs_out(m.secteurs_activite),
        centres_interet=m.centres_interet or [],
        niveau_acces_min=m.niveau_acces_min,
        salaire_debutant=m.salaire_debutant,
        accroche=m.accroche,
        format_court=m.format_court,
        competences=m.competences,
        nature_travail=m.nature_travail,
        condition_travail=m.condition_travail,
    )


# ── Domaines ──────────────────────────────────────────────────────────────────

def get_all_domaines(db: Session) -> list[DomaineOut]:
    """Retourne tous les domaines avec le compte de formations col2 et de métiers associés."""
    formation_counts = dict(
        db.query(Domaine.id, func.count(Formation.id))
        .outerjoin(Domaine.formations)
        .filter(Formation.acces_postbac_direct.is_(True))
        .group_by(Domaine.id)
        .all()
    )
    metier_counts = dict(
        db.query(Domaine.id, func.count(Metier.id))
        .outerjoin(Domaine.metiers)
        .group_by(Domaine.id)
        .all()
    )
    domaines = db.query(Domaine).order_by(Domaine.libelle).all()
    return [
        DomaineOut(
            id=d.id,
            libelle=d.libelle,
            slug=d.slug,
            nb_formations=formation_counts.get(d.id, 0),
            nb_metiers=metier_counts.get(d.id, 0),
        )
        for d in domaines
    ]


# ── Formations ────────────────────────────────────────────────────────────────

def get_formations(
    db: Session,
    domaine_id: int | None = None,
    type_sigle: str | None = None,
    niveau_etudes: str | None = None,
    postbac_direct_only: bool = True,
) -> list[FormationShort]:
    query = (
        db.query(Formation)
        .options(selectinload(Formation.domaines))
    )
    if postbac_direct_only:
        query = query.filter(Formation.acces_postbac_direct.is_(True))
    if domaine_id:
        query = query.join(Formation.domaines).filter(Domaine.id == domaine_id)
    if type_sigle:
        query = query.filter(Formation.type_sigle == type_sigle)
    if niveau_etudes:
        query = query.filter(Formation.niveau_etudes == niveau_etudes)

    return [_formation_to_short(f) for f in query.all()]


def get_formation_by_id(db: Session, formation_id: str) -> FormationDetail | None:
    f = (
        db.query(Formation)
        .options(selectinload(Formation.domaines))
        .filter(Formation.id == formation_id)
        .first()
    )
    if not f:
        return None
    return _formation_to_detail(f)


# ── Métiers ───────────────────────────────────────────────────────────────────

def get_metiers(
    db: Session,
    domaine_id: int | None = None,
    niveau_acces_min: str | None = None,
) -> list[MetierShort]:
    """Liste les métiers filtrés par domaine et/ou niveau d'accès minimum."""
    query = db.query(Metier)

    if domaine_id:
        query = query.join(Metier.domaines).filter(Domaine.id == domaine_id)

    if niveau_acces_min:
        query = query.filter(Metier.niveau_acces_min == niveau_acces_min)

    return [_metier_to_short(m) for m in query.all()]


def get_metier_by_id(db: Session, metier_id: str) -> MetierDetail | None:
    m = (
        db.query(Metier)
        .filter(Metier.id == metier_id)
        .first()
    )
    if not m:
        return None
    return _metier_to_detail(m)
