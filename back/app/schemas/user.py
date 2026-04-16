from pydantic import BaseModel
from typing import Optional


class SignupIn(BaseModel):
    prenom: str
    role: str           # "eleve" | "prof"
    class_code: Optional[str] = None   # requis pour role="eleve", ignoré pour "prof"


class LoginIn(BaseModel):
    prenom: str
    role: str
    class_code: Optional[str] = None


class UserOut(BaseModel):
    id: int
    prenom: str
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
