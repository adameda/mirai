"""
Modèles utilisateur.

User            : élève ou professeur
OnboardingAnswer: réponses au questionnaire d'onboarding (1 ligne par élève)
"""

from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prenom = Column(String(80), nullable=False)
    role = Column(String(10), nullable=False)   # "eleve" | "prof"

    # Clé étrangère vers Classe. Nullable car le prof n'est pas élève.
    classe_id = Column(Integer, ForeignKey("classes.id"), nullable=True)

    onboarded = Column(Boolean, default=False, nullable=False)

    classe = relationship("Classe", back_populates="eleves", foreign_keys=[classe_id])
    # Relation 1-1 vers les réponses d'onboarding
    onboarding = relationship("OnboardingAnswer", uselist=False, back_populates="user")
    favoris = relationship("Favori", back_populates="user")


class OnboardingAnswer(Base):
    """
    Réponses au questionnaire en 5 étapes.
    Chaque champ liste est stocké en JSON (tableau de strings).
    """
    __tablename__ = "onboarding_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Étape 1 — choix unique
    niveau = Column(String(30), nullable=True)          # ex: "Terminale"
    # Étape 2 — choix multiple
    matieres = Column(JSON, nullable=True)              # ex: ["Maths", "Informatique"]
    # Étape 3 — choix multiple
    style = Column(JSON, nullable=True)                 # ex: ["Analytique", "Concret"]
    # Étape 4 — choix unique
    duree = Column(String(40), nullable=True)           # ex: "Courtes — Bac+2/3"
    # Étape 5 — choix multiple + saisie libre
    domaines_interets = Column(JSON, nullable=True)     # ex: ["Informatique & Tech"]

    user = relationship("User", back_populates="onboarding")
