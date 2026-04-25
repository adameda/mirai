"""
Schémas Pydantic pour les données Onisep.

*Short : version liste (colonnes Exploration, peu de champs)
*Detail : version complète (panneau de détail)
"""

from pydantic import BaseModel
from typing import Optional


# ── Domaine ────────────────────────────────────────────────────────────────

class DomaineOut(BaseModel):
    id: int
    libelle: str
    slug: str
    nb_formations: int = 0
    nb_metiers: int = 0

    model_config = {"from_attributes": True}


# ── Formation ──────────────────────────────────────────────────────────────

class TypeFormationOut(BaseModel):
    sigle: Optional[str] = None
    libelle_court: Optional[str] = None
    libelle: Optional[str] = None


class FormationShort(BaseModel):
    """Utilisé dans les listes — colonne Formations de la page Exploration."""
    id: str
    libelle_complet: str
    libelle_generique: Optional[str] = None
    type_formation: TypeFormationOut
    duree: Optional[str] = None
    niveau_etudes: Optional[str] = None
    domaines: list[DomaineOut] = []
    description_courte: Optional[str] = None
    acces_postbac_direct: bool = False
    url: Optional[str] = None

    model_config = {"from_attributes": True}


class FormationDetail(BaseModel):
    """Utilisé dans le panneau de détail."""
    id: str
    libelle_complet: str
    libelle_generique: Optional[str] = None
    libelle_specifique: Optional[str] = None
    type_formation: TypeFormationOut
    duree: Optional[str] = None
    niveau_etudes: Optional[str] = None
    niveau_certification: Optional[str] = None
    domaines: list[DomaineOut] = []
    description_courte: Optional[str] = None
    acces: Optional[str] = None
    attendus: Optional[str] = None
    poursuite_etudes: Optional[list] = None
    url: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Métier ─────────────────────────────────────────────────────────────────

class SecteurOut(BaseModel):
    id: str
    libelle: str


class MetierShort(BaseModel):
    """Utilisé dans les listes — colonne Métiers de la page Exploration."""
    id: str
    nom: str
    libelle_feminin: Optional[str] = None
    libelle_masculin: Optional[str] = None
    secteurs_activite: list[SecteurOut] = []
    niveau_acces_min: Optional[str] = None
    salaire_debutant: Optional[str] = None
    accroche: Optional[str] = None

    model_config = {"from_attributes": True}


class MetierDetail(BaseModel):
    """Utilisé dans le panneau de détail."""
    id: str
    nom: str
    libelle_feminin: Optional[str] = None
    libelle_masculin: Optional[str] = None
    synonymes: list[str] = []
    secteurs_activite: list[SecteurOut] = []
    centres_interet: list[dict] = []
    niveau_acces_min: Optional[str] = None
    salaire_debutant: Optional[str] = None
    accroche: Optional[str] = None
    format_court: Optional[str] = None
    competences: Optional[str] = None
    nature_travail: Optional[str] = None
    condition_travail: Optional[str] = None

    model_config = {"from_attributes": True}
