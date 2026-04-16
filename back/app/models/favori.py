"""
Modèle favori.

Un favori est un item sauvegardé par un élève.
type = "domaine" | "formation" | "metier"

On utilise des FK nullable selon le type pour garder l'intégrité référentielle
tout en permettant les 3 types dans une seule table.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from .base import Base


class Favori(Base):
    __tablename__ = "favoris"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(10), nullable=False)  # "domaine" | "formation" | "metier"

    # Une seule FK est non-nulle selon le type
    domaine_id = Column(Integer, ForeignKey("domaines.id"), nullable=True)
    formation_id = Column(String(20), ForeignKey("formations.id"), nullable=True)
    metier_id = Column(String(20), ForeignKey("metiers.id"), nullable=True)

    __table_args__ = (
        # Exactement une FK doit être non-nulle
        CheckConstraint(
            "(type = 'domaine' AND domaine_id IS NOT NULL AND formation_id IS NULL AND metier_id IS NULL) OR "
            "(type = 'formation' AND formation_id IS NOT NULL AND domaine_id IS NULL AND metier_id IS NULL) OR "
            "(type = 'metier' AND metier_id IS NOT NULL AND domaine_id IS NULL AND formation_id IS NULL)",
            name="ck_favori_type_coherent",
        ),
    )

    user = relationship("User", back_populates="favoris")
    domaine = relationship("Domaine")
    formation = relationship("Formation", back_populates="favoris")
    metier = relationship("Metier", back_populates="favoris")
