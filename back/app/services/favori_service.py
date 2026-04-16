"""
Couche service — favoris élève.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.favori import Favori
from app.models.onisep import Domaine, Formation, Metier
from app.models.user import User
from app.schemas.favori import FavoriIn, FavoriOut, FavorisGroupedOut


# ── Helpers ────────────────────────────────────────────────────────────────

def _build_favori_out(db: Session, favori: Favori) -> FavoriOut:
    """Construit FavoriOut en résolvant le libellé et le parent selon le type."""
    if favori.type == "domaine":
        obj = db.get(Domaine, favori.domaine_id)
        libelle = obj.libelle if obj else "?"
        return FavoriOut(id=favori.id, type="domaine", ref_id=str(favori.domaine_id), libelle=libelle)

    if favori.type == "formation":
        obj = db.get(Formation, favori.formation_id)
        libelle = obj.libelle_complet if obj else "?"
        # Premier domaine de la formation comme parent_libelle
        parent = None
        if obj and obj.domaines:
            parent = obj.domaines[0].libelle
        return FavoriOut(id=favori.id, type="formation", ref_id=favori.formation_id, libelle=libelle, parent_libelle=parent)

    if favori.type == "metier":
        obj = db.get(Metier, favori.metier_id)
        libelle = obj.nom if obj else "?"
        # Premier secteur d'activité comme parent_libelle
        parent = None
        if obj and obj.secteurs_activite:
            parent = obj.secteurs_activite[0].get("libelle")
        return FavoriOut(id=favori.id, type="metier", ref_id=favori.metier_id, libelle=libelle, parent_libelle=parent)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Type invalide")


# ── Lecture ────────────────────────────────────────────────────────────────

def get_favoris(db: Session, user: User) -> FavorisGroupedOut:
    if user.role != "eleve":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux élèves")

    favoris = db.query(Favori).filter(Favori.user_id == user.id).all()

    grouped = FavorisGroupedOut()
    for f in favoris:
        out = _build_favori_out(db, f)
        if f.type == "domaine":
            grouped.domaines.append(out)
        elif f.type == "formation":
            grouped.formations.append(out)
        elif f.type == "metier":
            grouped.metiers.append(out)

    return grouped


# ── Ajout ──────────────────────────────────────────────────────────────────

def add_favori(db: Session, user: User, data: FavoriIn) -> FavoriOut:
    if user.role != "eleve":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux élèves")

    if data.type == "domaine":
        try:
            domaine_id = int(data.ref_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="ref_id doit être un entier pour un domaine")
        if not db.get(Domaine, domaine_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domaine introuvable")
        # Doublon
        existing = db.query(Favori).filter(
            Favori.user_id == user.id, Favori.type == "domaine", Favori.domaine_id == domaine_id
        ).first()
        if existing:
            return _build_favori_out(db, existing)
        favori = Favori(user_id=user.id, type="domaine", domaine_id=domaine_id)

    elif data.type == "formation":
        if not db.get(Formation, data.ref_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation introuvable")
        existing = db.query(Favori).filter(
            Favori.user_id == user.id, Favori.type == "formation", Favori.formation_id == data.ref_id
        ).first()
        if existing:
            return _build_favori_out(db, existing)
        favori = Favori(user_id=user.id, type="formation", formation_id=data.ref_id)

    elif data.type == "metier":
        if not db.get(Metier, data.ref_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Métier introuvable")
        existing = db.query(Favori).filter(
            Favori.user_id == user.id, Favori.type == "metier", Favori.metier_id == data.ref_id
        ).first()
        if existing:
            return _build_favori_out(db, existing)
        favori = Favori(user_id=user.id, type="metier", metier_id=data.ref_id)

    else:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="type doit être 'domaine', 'formation' ou 'metier'")

    db.add(favori)
    db.commit()
    db.refresh(favori)
    return _build_favori_out(db, favori)


# ── Suppression ────────────────────────────────────────────────────────────

def delete_favori(db: Session, user: User, favori_id: int) -> None:
    if user.role != "eleve":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux élèves")

    favori = db.get(Favori, favori_id)
    if not favori:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favori introuvable")
    if favori.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce favori ne vous appartient pas")

    db.delete(favori)
    db.commit()
