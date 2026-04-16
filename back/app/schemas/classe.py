from pydantic import BaseModel
from typing import Optional
from datetime import date


class EleveProgressOut(BaseModel):
    id: int
    prenom: str
    onboarded: bool
    nb_domaines: int
    nb_formations: int
    nb_metiers: int

    model_config = {"from_attributes": True}


class ClasseOut(BaseModel):
    code: str
    nb_eleves: int
    eleves: list[EleveProgressOut]

    model_config = {"from_attributes": True}


class ObjectifStatsOut(BaseModel):
    atteints: int
    total: int
    pct: int


class ClasseStatsOut(BaseModel):
    nb_eleves: int
    nb_profils_complets: int
    pct_profils_complets: int
    objectifs: dict[str, ObjectifStatsOut]


class ClasseConfigIn(BaseModel):
    target_domaines: Optional[int] = None
    date_domaines: Optional[date] = None
    target_formations: Optional[int] = None
    date_formations: Optional[date] = None
    target_metiers: Optional[int] = None
    date_metiers: Optional[date] = None


class ClasseConfigOut(ClasseConfigIn):
    model_config = {"from_attributes": True}
