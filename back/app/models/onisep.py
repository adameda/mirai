"""
Modèles liés aux données Onisep.

Domaine         : macro-domaine Mirai (ex: "Informatique & Tech")
Formation       : fiche formation Onisep (identifiant = FOR.XXXX)
Metier          : fiche métier Onisep (identifiant = MET.XXXX)
FormationDomaine: relation N-N formation ↔ domaine
FormationMetier : relation N-N formation ↔ métier (issu des fiches XML)
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from .base import Base


# Table d'association N-N : formation ↔ domaine
FormationDomaine = Table(
    "formation_domaine",
    Base.metadata,
    Column("formation_id", String, ForeignKey("formations.id"), primary_key=True),
    Column("domaine_id", Integer, ForeignKey("domaines.id"), primary_key=True),
)

# Table d'association N-N : formation ↔ métier
FormationMetier = Table(
    "formation_metier",
    Base.metadata,
    Column("formation_id", String, ForeignKey("formations.id"), primary_key=True),
    Column("metier_id", String, ForeignKey("metiers.id"), primary_key=True),
)


class Domaine(Base):
    """
    Macro-domaine Mirai. Liste fixe définie à l'ingestion via le mapping
    sous_domaines_web Onisep → domaine Mirai.
    """
    __tablename__ = "domaines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    libelle = Column(String(120), nullable=False, unique=True)
    # Slug URL-friendly, ex: "informatique-tech"
    slug = Column(String(80), nullable=False, unique=True)

    formations = relationship("Formation", secondary=FormationDomaine, back_populates="domaines")


class Formation(Base):
    """
    Fiche formation Onisep. Seules les formations bac+2 à bac+5 avec
    au moins un champ descriptif non vide sont ingérées (filtrage à l'étape 4).
    """
    __tablename__ = "formations"

    # Identifiant Onisep d'origine, ex: "FOR.8538"
    id = Column(String(20), primary_key=True)

    libelle_complet = Column(String(512), nullable=False)
    # Libellé court du diplôme, ex: "science des données"
    libelle_generique = Column(String(256), nullable=True)
    # Spécialité / parcours, ex: "exploration et modélisation statistique"
    libelle_specifique = Column(String(256), nullable=True)

    # Type de formation
    type_sigle = Column(String(30), nullable=True)        # ex: "BUT"
    type_libelle_court = Column(String(60), nullable=True) # ex: "BUT"
    type_libelle = Column(String(120), nullable=True)      # ex: "bachelor universitaire de technologie"

    duree = Column(String(30), nullable=True)              # ex: "3 ans"
    niveau_etudes = Column(String(30), nullable=True)      # ex: "bac + 3"
    niveau_certification = Column(String(20), nullable=True) # ex: "niveau 6"

    # Champs texte issus du XML — nullable car souvent absents (cf. analyse : 36% / 30% / 15%)
    description_courte = Column(Text, nullable=True)
    acces = Column(Text, nullable=True)
    attendus = Column(Text, nullable=True)

    url = Column(String(512), nullable=True)
    # Poursuites d'études : [{"id": "FOR.XXXX", "libelle": "..."}]
    poursuite_etudes = Column(JSON, nullable=True)

    domaines = relationship("Domaine", secondary=FormationDomaine, back_populates="formations")
    metiers = relationship("Metier", secondary=FormationMetier, back_populates="formations")
    favoris = relationship("Favori", back_populates="formation")


class Metier(Base):
    """
    Fiche métier Onisep.
    Les champs accroche et format_court sont présents sur 100% des fiches.
    """
    __tablename__ = "metiers"

    # Identifiant Onisep d'origine, ex: "MET.613"
    id = Column(String(20), primary_key=True)

    nom = Column(String(256), nullable=False)
    libelle_feminin = Column(String(256), nullable=True)
    libelle_masculin = Column(String(256), nullable=True)

    # Listes stockées en JSON natif PostgreSQL
    synonymes = Column(JSON, nullable=True)          # ["gestionnaire de données", ...]
    secteurs_activite = Column(JSON, nullable=True)  # [{"id": "T-IDEO2.4851", "libelle": "Banque"}]
    centres_interet = Column(JSON, nullable=True)    # [{"id": "T-IDEO2.4816", "libelle": "..."}]

    niveau_acces_min = Column(String(30), nullable=True)
    salaire_debutant = Column(Text, nullable=True)

    # Champs texte — accroche et format_court à 100%, les autres à 80%
    accroche = Column(Text, nullable=True)
    format_court = Column(Text, nullable=True)
    competences = Column(Text, nullable=True)
    nature_travail = Column(Text, nullable=True)
    condition_travail = Column(Text, nullable=True)

    # True si le métier est présent dans plusieurs secteurs (metier_transverse=oui)
    est_transverse = Column(Boolean, default=False, nullable=False)

    formations = relationship("Formation", secondary=FormationMetier, back_populates="metiers")
    favoris = relationship("Favori", back_populates="metier")
