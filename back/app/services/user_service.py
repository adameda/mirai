"""
Couche service — utilisateurs, auth, onboarding.
"""

import random
import string

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.auth import create_access_token
from app.models.user import User, OnboardingAnswer
from app.models.classe import Classe, ClasseConfig
from app.schemas.user import SignupIn, LoginIn, UserOut, OnboardingIn, OnboardingOut
from app.schemas.auth import TokenOut


# ── Utilitaires ────────────────────────────────────────────────────────────

def _generate_class_code(db: Session, length: int = 6) -> str:
    """Génère un code classe unique (lettres majuscules + chiffres)."""
    chars = string.ascii_uppercase + string.digits
    for _ in range(20):  # 20 tentatives avant d'abandonner
        code = "".join(random.choices(chars, k=length))
        if not db.query(Classe).filter(Classe.code == code).first():
            return code
    raise RuntimeError("Impossible de générer un code classe unique")


# ── Signup ─────────────────────────────────────────────────────────────────

def signup(db: Session, data: SignupIn) -> TokenOut:
    if data.role == "eleve":
        if not data.class_code:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="class_code requis pour un élève",
            )
        classe = db.query(Classe).filter(Classe.code == data.class_code.upper()).first()
        if not classe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Code classe introuvable",
            )
        user = User(prenom=data.prenom, role="eleve", classe_id=classe.id)
        db.add(user)
        db.commit()
        db.refresh(user)

    elif data.role == "prof":
        user = User(prenom=data.prenom, role="prof")
        db.add(user)
        db.flush()  # récupère user.id avant de créer la classe

        code = _generate_class_code(db)
        classe = Classe(code=code, prof_id=user.id)
        db.add(classe)
        db.flush()

        # Config par défaut pour la classe
        config = ClasseConfig(
            classe_id=classe.id,
            target_domaines=3,
            target_formations=5,
            target_metiers=4,
        )
        db.add(config)
        db.commit()
        db.refresh(user)

    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="role doit être 'eleve' ou 'prof'",
        )

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=_build_user_out(db, user))


# ── Login ──────────────────────────────────────────────────────────────────

def login(db: Session, data: LoginIn) -> TokenOut:
    """
    Auth simplifiée : prenom + role + class_code.
    Pour un élève : on cherche un user avec ce prénom dans cette classe.
    Pour un prof : on cherche un user avec ce prénom et role=prof.
    """
    if data.role == "eleve":
        if not data.class_code:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="class_code requis")
        classe = db.query(Classe).filter(Classe.code == data.class_code.upper()).first()
        if not classe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code classe introuvable")
        user = (
            db.query(User)
            .filter(User.prenom == data.prenom, User.role == "eleve", User.classe_id == classe.id)
            .first()
        )
    else:
        user = db.query(User).filter(User.prenom == data.prenom, User.role == "prof").first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects")

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=_build_user_out(db, user))


# ── Profil ─────────────────────────────────────────────────────────────────

def _build_user_out(db: Session, user: User) -> UserOut:
    """Construit UserOut en résolvant le code classe."""
    class_code = None
    if user.role == "eleve" and user.classe_id:
        classe = db.query(Classe).filter(Classe.id == user.classe_id).first()
        class_code = classe.code if classe else None
    elif user.role == "prof":
        classe = db.query(Classe).filter(Classe.prof_id == user.id).first()
        class_code = classe.code if classe else None

    return UserOut(
        id=user.id,
        prenom=user.prenom,
        role=user.role,
        class_code=class_code,
        onboarded=user.onboarded,
    )


def get_me(db: Session, user: User) -> UserOut:
    return _build_user_out(db, user)


# ── Onboarding ─────────────────────────────────────────────────────────────

def save_onboarding(db: Session, user: User, data: OnboardingIn) -> OnboardingOut:
    if user.role != "eleve":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux élèves")

    existing = db.query(OnboardingAnswer).filter(OnboardingAnswer.user_id == user.id).first()
    if existing:
        existing.niveau = data.niveau
        existing.matieres = data.matieres
        existing.style = data.style
        existing.duree = data.duree
        existing.domaines_interets = data.domaines_interets
    else:
        answer = OnboardingAnswer(
            user_id=user.id,
            niveau=data.niveau,
            matieres=data.matieres,
            style=data.style,
            duree=data.duree,
            domaines_interets=data.domaines_interets,
        )
        db.add(answer)

    user.onboarded = True
    db.commit()
    db.refresh(user)

    return OnboardingOut(onboarded=True, onboarding_answers=data)
