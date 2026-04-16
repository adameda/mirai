from pydantic import BaseModel
from typing import Optional


class FavoriIn(BaseModel):
    type: str           # "domaine" | "formation" | "metier"
    ref_id: str         # ex: "FOR.8538", "MET.613", ou l'id entier du domaine en str


class FavoriOut(BaseModel):
    id: int
    type: str
    ref_id: str
    libelle: str
    parent_libelle: Optional[str] = None   # domaine de la formation, ou secteur du métier

    model_config = {"from_attributes": True}


class FavorisGroupedOut(BaseModel):
    domaines: list[FavoriOut] = []
    formations: list[FavoriOut] = []
    metiers: list[FavoriOut] = []
