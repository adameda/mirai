from sqlalchemy import Column, Integer, String, Float
from .base import Base


class ParcoursupFormation(Base):
    __tablename__ = "parcoursup_formations"

    cod_aff_form  = Column(Integer, primary_key=True)
    session       = Column(Integer, nullable=False)
    etablissement = Column(String, nullable=False)
    code_uai      = Column(String(8))
    statut        = Column(String(60))
    filiere_agregee      = Column(String(60))   # BTS, BUT, CPGE, Licence…
    filiere_type         = Column(String(120))  # BTS - Services, Licence - Arts…  (53 valeurs)
    filiere_specialite   = Column(String)       # Management Commercial Opérationnel…
    filiere_detaillee    = Column(String)
    selectivite   = Column(String(60))
    region        = Column(String(80))
    departement   = Column(String(80))
    commune       = Column(String(80))
    capacite      = Column(Integer)
    nb_candidats  = Column(Integer)
    nb_admis      = Column(Integer)
    taux_acces    = Column(Float)
    lien_parcoursup = Column(String)
    pct_admis_filles  = Column(Float)
    pct_boursiers     = Column(Float)
    pct_admis_bg      = Column(Float)
    pct_admis_bt      = Column(Float)
    pct_admis_bp      = Column(Float)
    pct_mention_ab    = Column(Float)
    pct_mention_b     = Column(Float)
    pct_mention_tb    = Column(Float)
    pct_mention_tbf   = Column(Float)
