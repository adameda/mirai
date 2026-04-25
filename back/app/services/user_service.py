import random
import string

from fastapi import HTTPException, status
import bcrypt as _bcrypt
from sqlalchemy.orm import Session

from app.core.auth import create_access_token
from app.core.config import settings
from app.models.user import User, OnboardingAnswer
from app.models.classe import Classe, ClasseConfig
from app.schemas.user import SignupIn, LoginIn, UserOut, OnboardingIn, OnboardingOut
from app.schemas.auth import TokenOut


def _hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return _bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ── Utilitaires ────────────────────────────────────────────────────────────

def _generate_class_code(db: Session, length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(random.choices(chars, k=length))
        if not db.query(Classe).filter(Classe.code == code).first():
            return code
    raise RuntimeError("Impossible de générer un code classe unique")


def _build_user_out(db: Session, user: User) -> UserOut:
    class_code = None
    if user.role == "eleve" and user.classe_id:
        classe = db.query(Classe).filter(Classe.id == user.classe_id).first()
        class_code = classe.code if classe else None
    elif user.role == "prof":
        classe = db.query(Classe).filter(Classe.prof_id == user.id).first()
        class_code = classe.code if classe else None

    return UserOut(
        id=user.id,
        nom=user.nom,
        prenom=user.prenom,
        email=user.email,
        role=user.role,
        class_code=class_code,
        onboarded=user.onboarded,
    )


# ── Signup ─────────────────────────────────────────────────────────────────

def signup(db: Session, data: SignupIn) -> TokenOut:
    if data.invite_code != settings.INVITE_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Code d'invitation invalide",
        )

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte avec cet email existe déjà",
        )

    hashed = _hash_password(data.password)

    if data.role == "eleve":
        if not data.class_code:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="class_code requis pour un élève")
        classe = db.query(Classe).filter(Classe.code == data.class_code.upper()).first()
        if not classe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code classe introuvable")

        user = User(nom=data.nom, prenom=data.prenom, email=data.email, hashed_password=hashed, role="eleve", classe_id=classe.id)
        db.add(user)
        db.commit()
        db.refresh(user)

    else:  # prof
        user = User(nom=data.nom, prenom=data.prenom, email=data.email, hashed_password=hashed, role="prof")
        db.add(user)
        db.flush()

        code = _generate_class_code(db)
        classe = Classe(code=code, prof_id=user.id)
        db.add(classe)
        db.flush()

        config = ClasseConfig(classe_id=classe.id, target_domaines=3, target_formations=5, target_metiers=4)
        db.add(config)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=_build_user_out(db, user))


# ── Login ──────────────────────────────────────────────────────────────────

def login(db: Session, data: LoginIn) -> TokenOut:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not _verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=_build_user_out(db, user))


# ── Profil ─────────────────────────────────────────────────────────────────

def get_me(db: Session, user: User) -> UserOut:
    return _build_user_out(db, user)


# ── Onboarding ─────────────────────────────────────────────────────────────

def save_onboarding(db: Session, user: User, data: OnboardingIn) -> OnboardingOut:
    if user.role != "eleve":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux élèves")

    existing = db.query(OnboardingAnswer).filter(OnboardingAnswer.user_id == user.id).first()
    if existing:
        existing.niveau           = data.niveau
        existing.matieres         = data.matieres
        existing.style            = data.style
        existing.duree            = data.duree
        existing.domaines_interets = data.domaines_interets
    else:
        db.add(OnboardingAnswer(
            user_id=user.id,
            niveau=data.niveau,
            matieres=data.matieres,
            style=data.style,
            duree=data.duree,
            domaines_interets=data.domaines_interets,
        ))

    user.onboarded = True
    db.commit()
    db.refresh(user)
    return OnboardingOut(onboarded=True, onboarding_answers=data)
