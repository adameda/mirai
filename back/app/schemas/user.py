import re
from pydantic import BaseModel, field_validator
from typing import Optional


class SignupIn(BaseModel):
    nom: str
    prenom: str
    email: str
    password: str
    role: str
    class_code: Optional[str] = None
    invite_code: str

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Le mot de passe doit contenir au moins une majuscule")
        if not re.search(r"\d", v):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")
        if not re.search(r"[!@#$%^&*()\-_=+\[\]{};:'\",.<>?/\\|`~]", v):
            raise ValueError("Le mot de passe doit contenir au moins un caractère spécial")
        return v

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        if v not in ("eleve", "prof"):
            raise ValueError("role doit être 'eleve' ou 'prof'")
        return v


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.strip().lower()


class UserOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str
    class_code: Optional[str] = None
    onboarded: bool

    model_config = {"from_attributes": True}


class OnboardingIn(BaseModel):
    niveau: Optional[str] = None
    voie: Optional[str] = None                      # "generale" | "technologique"
    filiere: Optional[str] = None                   # "STMG", "STI2D", etc.
    specialites: Optional[list[str]] = None
    matieres_fortes: Optional[list[str]] = None
    matieres_aimees: Optional[list[str]] = None
    centres_interet: Optional[list[str]] = None     # libellés affichés à l'élève
    style: Optional[list[str]] = None
    duree: Optional[str] = None
    domaines_interets: Optional[list[str]] = None
    pression_academique: Optional[str] = None


class OnboardingOut(BaseModel):
    onboarded: bool
    onboarding_answers: Optional[OnboardingIn] = None

    model_config = {"from_attributes": True}
