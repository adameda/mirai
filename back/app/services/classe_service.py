"""
Couche service — classe et tableau de bord prof.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.classe import Classe, ClasseConfig
from app.models.favori import Favori
from app.models.user import User
from app.schemas.classe import (
    ClasseOut,
    ClasseStatsOut,
    ClasseConfigIn,
    ClasseConfigOut,
    EleveProgressOut,
    ObjectifStatsOut,
)


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_classe_or_403(db: Session, user: User) -> Classe:
    """Récupère la classe du prof ou lève 403."""
    if user.role != "prof":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux professeurs")
    classe = (
        db.query(Classe)
        .options(selectinload(Classe.eleves), selectinload(Classe.config))
        .filter(Classe.prof_id == user.id)
        .first()
    )
    if not classe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classe introuvable")
    return classe


def _nb_favoris_par_type(db: Session, user_id: int, type_: str) -> int:
    return db.query(Favori).filter(Favori.user_id == user_id, Favori.type == type_).count()


# ── Classe ─────────────────────────────────────────────────────────────────

def get_classe_me(db: Session, user: User) -> ClasseOut:
    classe = _get_classe_or_403(db, user)

    eleves_out = []
    for eleve in classe.eleves:
        nb_domaines = _nb_favoris_par_type(db, eleve.id, "domaine")
        nb_formations = _nb_favoris_par_type(db, eleve.id, "formation")
        nb_metiers = _nb_favoris_par_type(db, eleve.id, "metier")
        eleves_out.append(EleveProgressOut(
            id=eleve.id,
            prenom=eleve.prenom,
            onboarded=eleve.onboarded,
            nb_domaines=nb_domaines,
            nb_formations=nb_formations,
            nb_metiers=nb_metiers,
        ))

    return ClasseOut(
        code=classe.code,
        nb_eleves=len(eleves_out),
        eleves=eleves_out,
    )


# ── Stats ──────────────────────────────────────────────────────────────────

def get_classe_stats(db: Session, user: User) -> ClasseStatsOut:
    classe = _get_classe_or_403(db, user)
    config = classe.config
    eleves = classe.eleves
    nb_eleves = len(eleves)

    # Profils complets = onboarded
    nb_profils = sum(1 for e in eleves if e.onboarded)
    pct_profils = round(nb_profils / nb_eleves * 100) if nb_eleves else 0

    def _obj_stats(type_: str, target: int | None) -> ObjectifStatsOut:
        if target is None or nb_eleves == 0:
            return ObjectifStatsOut(atteints=0, total=nb_eleves, pct=0)
        atteints = sum(
            1 for e in eleves if _nb_favoris_par_type(db, e.id, type_) >= target
        )
        return ObjectifStatsOut(
            atteints=atteints,
            total=nb_eleves,
            pct=round(atteints / nb_eleves * 100),
        )

    objectifs = {
        "domaines": _obj_stats("domaine", config.target_domaines if config else None),
        "formations": _obj_stats("formation", config.target_formations if config else None),
        "metiers": _obj_stats("metier", config.target_metiers if config else None),
    }

    return ClasseStatsOut(
        nb_eleves=nb_eleves,
        nb_profils_complets=nb_profils,
        pct_profils_complets=pct_profils,
        objectifs=objectifs,
    )


# ── Config ─────────────────────────────────────────────────────────────────

def get_classe_config(db: Session, user: User) -> ClasseConfigOut:
    if user.role == "prof":
        classe = _get_classe_or_403(db, user)
    elif user.role == "eleve":
        if not user.classe_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Élève sans classe")
        classe = (
            db.query(Classe)
            .options(selectinload(Classe.config))
            .filter(Classe.id == user.classe_id)
            .first()
        )
        if not classe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classe introuvable")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    cfg = classe.config
    if not cfg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config introuvable")
    return ClasseConfigOut(
        target_domaines=cfg.target_domaines,
        date_domaines=cfg.date_domaines,
        target_formations=cfg.target_formations,
        date_formations=cfg.date_formations,
        target_metiers=cfg.target_metiers,
        date_metiers=cfg.date_metiers,
    )


def update_classe_config(db: Session, user: User, data: ClasseConfigIn) -> ClasseConfigOut:
    classe = _get_classe_or_403(db, user)
    cfg = classe.config
    if not cfg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config introuvable")

    # Remplacement complet (PUT sémantique) — permet de remettre les dates à null
    cfg.target_domaines   = data.target_domaines
    cfg.date_domaines     = data.date_domaines
    cfg.target_formations = data.target_formations
    cfg.date_formations   = data.date_formations
    cfg.target_metiers    = data.target_metiers
    cfg.date_metiers      = data.date_metiers

    db.commit()
    db.refresh(cfg)

    return ClasseConfigOut(
        target_domaines=cfg.target_domaines,
        date_domaines=cfg.date_domaines,
        target_formations=cfg.target_formations,
        date_formations=cfg.date_formations,
        target_metiers=cfg.target_metiers,
        date_metiers=cfg.date_metiers,
    )
