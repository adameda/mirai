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
    matieres: Optional[list[str]] = None
    style: Optional[list[str]] = None
    duree: Optional[str] = None
    domaines_interets: Optional[list[str]] = None


class OnboardingOut(BaseModel):
    onboarded: bool
    onboarding_answers: Optional[OnboardingIn] = None

    model_config = {"from_attributes": True}
