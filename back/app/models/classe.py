"""
Modèles classe.

Classe      : groupe d'élèves rattachés à un prof
ClasseConfig: objectifs/jalons configurés par le prof pour sa classe
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from .base import Base


class Classe(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # Code partagé par le prof à ses élèves, ex: "ABC123"
    code = Column(String(10), nullable=False, unique=True)
    # Prof propriétaire de la classe
    prof_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    prof = relationship("User", foreign_keys=[prof_id])
    eleves = relationship("User", back_populates="classe", foreign_keys="User.classe_id")
    config = relationship("ClasseConfig", uselist=False, back_populates="classe")


class ClasseConfig(Base):
    """
    Objectifs définis par le prof pour sa classe.
    obj1 = compléter le profil (pas de target numérique)
    obj2 = sauvegarder N domaines avant date_domaines
    obj3 = sauvegarder N formations avant date_formations
    obj4 = sauvegarder N métiers avant date_metiers
    """
    __tablename__ = "classe_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    classe_id = Column(Integer, ForeignKey("classes.id"), nullable=False, unique=True)

    target_domaines = Column(Integer, nullable=True)
    date_domaines = Column(Date, nullable=True)

    target_formations = Column(Integer, nullable=True)
    date_formations = Column(Date, nullable=True)

    target_metiers = Column(Integer, nullable=True)
    date_metiers = Column(Date, nullable=True)

    classe = relationship("Classe", back_populates="config")
