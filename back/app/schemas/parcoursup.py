from pydantic import BaseModel
from typing import Optional


class ParcoursupFormationOut(BaseModel):
    cod_aff_form        : int
    session             : int
    etablissement       : str
    statut              : Optional[str] = None
    filiere_agregee     : Optional[str] = None
    filiere_type        : Optional[str] = None
    filiere_specialite  : Optional[str] = None
    filiere_detaillee   : Optional[str] = None
    selectivite         : Optional[str] = None
    region              : Optional[str] = None
    departement         : Optional[str] = None
    commune             : Optional[str] = None
    capacite            : Optional[int] = None
    nb_candidats        : Optional[int] = None
    nb_admis            : Optional[int] = None
    taux_acces          : Optional[float] = None
    lien_parcoursup     : Optional[str] = None
    pct_admis_filles    : Optional[float] = None
    pct_boursiers       : Optional[float] = None
    pct_admis_bg        : Optional[float] = None
    pct_admis_bt        : Optional[float] = None
    pct_admis_bp        : Optional[float] = None
    pct_mention_ab      : Optional[float] = None
    pct_mention_b       : Optional[float] = None
    pct_mention_tb      : Optional[float] = None
    pct_mention_tbf     : Optional[float] = None

    model_config = {"from_attributes": True}


class FiltresOut(BaseModel):
    filieres_agregees : list[str]
    filieres_types    : list[str]
    regions           : list[str]
    selectivites      : list[str]
