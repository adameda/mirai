from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    nom             = Column(String(80),  nullable=False)
    prenom          = Column(String(80),  nullable=False)
    email           = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(String(10),  nullable=False)   # "eleve" | "prof"
    classe_id       = Column(Integer, ForeignKey("classes.id"), nullable=True)
    onboarded       = Column(Boolean, default=False, nullable=False)

    classe    = relationship("Classe", back_populates="eleves", foreign_keys=[classe_id])
    onboarding = relationship("OnboardingAnswer", uselist=False, back_populates="user")
    favoris   = relationship("Favori", back_populates="user")


class OnboardingAnswer(Base):
    __tablename__ = "onboarding_answers"

    id      = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    niveau            = Column(String(30), nullable=True)
    matieres          = Column(JSON,       nullable=True)
    style             = Column(JSON,       nullable=True)
    duree             = Column(String(40), nullable=True)
    domaines_interets = Column(JSON,       nullable=True)

    user = relationship("User", back_populates="onboarding")
