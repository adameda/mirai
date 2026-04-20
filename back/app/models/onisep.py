"""
Modèles liés aux données Onisep.

Domaine         : domaine Mirai (ex: "Informatique & Numérique") — 13 au total
Formation       : fiche formation Onisep (identifiant = FOR.XXXX)
Metier          : fiche métier Onisep (identifiant = MET.XXXX)
FormationDomaine: relation N-N formation ↔ domaine (depuis sous_domaines_web XML)
FormationMetier : relation N-N formation ↔ métier (depuis metiers_formation XML)
MetierDomaine   : relation N-N métier ↔ domaine (depuis CSV métiers Onisep)
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

# Table d'association N-N : métier ↔ domaine
MetierDomaine = Table(
    "metier_domaine",
    Base.metadata,
    Column("metier_id", String, ForeignKey("metiers.id"), primary_key=True),
    Column("domaine_id", Integer, ForeignKey("domaines.id"), primary_key=True),
)


class Domaine(Base):
    """
    Domaine Mirai. 13 domaines fixes définis à l'ingestion.
    Chaque domaine couvre un ou plusieurs macro-domaines Onisep.
    """
    __tablename__ = "domaines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    libelle = Column(String(120), nullable=False, unique=True)
    # Slug URL-friendly, ex: "informatique-numerique"
    slug = Column(String(80), nullable=False, unique=True)

    formations = relationship("Formation", secondary=FormationDomaine, back_populates="domaines")
    metiers = relationship("Metier", secondary=MetierDomaine, back_populates="domaines")


class Formation(Base):
    """
    Fiche formation Onisep. Seules les formations bac+2 à bac+5 avec
    au moins un champ descriptif non vide sont ingérées.
    """
    __tablename__ = "formations"

    # Identifiant Onisep d'origine, ex: "FOR.8538"
    id = Column(String(20), primary_key=True)

    libelle_complet = Column(String(512), nullable=False)
    libelle_generique = Column(String(256), nullable=True)
    libelle_specifique = Column(String(256), nullable=True)

    # Type de formation
    type_sigle = Column(String(30), nullable=True)         # ex: "BUT"
    type_libelle_court = Column(String(60), nullable=True)  # ex: "BUT"
    type_libelle = Column(String(120), nullable=True)       # ex: "bachelor universitaire de technologie"

    duree = Column(String(30), nullable=True)               # ex: "3 ans"
    niveau_etudes = Column(String(30), nullable=True)       # ex: "bac + 3"
    niveau_certification = Column(String(20), nullable=True) # ex: "niveau 6"

    # Champs texte issus du XML
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
    Les domaines sont issus du CSV Onisep (le XML métiers ne contient pas cette info).
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

    accroche = Column(Text, nullable=True)
    format_court = Column(Text, nullable=True)
    competences = Column(Text, nullable=True)
    nature_travail = Column(Text, nullable=True)
    condition_travail = Column(Text, nullable=True)

    est_transverse = Column(Boolean, default=False, nullable=False)

    domaines = relationship("Domaine", secondary=MetierDomaine, back_populates="metiers")
    formations = relationship("Formation", secondary=FormationMetier, back_populates="metiers")
    favoris = relationship("Favori", back_populates="metier")
