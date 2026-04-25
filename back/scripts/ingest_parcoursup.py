"""
Ingestion du fichier ParcourSup dans la table parcoursup_formations.
Usage : python scripts/ingest_parcoursup.py
"""
import csv
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.parcoursup import ParcoursupFormation

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "fr-esr-parcoursup.csv")


def _int(val):
    try: return int(val)
    except: return None

def _float(val):
    try: return float(str(val).replace(",", "."))
    except: return None


def build_col_index(headers):
    """Résout les noms de colonnes en indices — robuste aux apostrophes typographiques."""
    idx = {}
    for i, h in enumerate(headers):
        # Normalise les apostrophes pour la recherche
        key = h.strip().replace("’", "'").replace("‘", "'")
        idx[key] = i
    return idx

def get_val(row, idx_map, name, fallback_idx=None):
    i = idx_map.get(name, fallback_idx)
    if i is None or i >= len(row): return None
    return row[i].strip() or None


def ingest():
    ParcoursupFormation.__table__.drop(engine, checkfirst=True)
    Base.metadata.create_all(bind=engine, tables=[ParcoursupFormation.__table__])

    db = SessionLocal()
    try:
        rows_to_insert = []

        with open(CSV_PATH, encoding="utf-8-sig") as f:
            raw = list(csv.reader(f, delimiter=";"))

        headers = raw[0]
        idx = build_col_index(headers)

        # Colonnes "Filière de formation" dupliquées dans le CSV :
        # première occurrence = établissement + formation (longue)
        # dernière occurrence  = type propre (53 valeurs)
        filiere_detaillee_idx = next(i for i, h in enumerate(headers) if h.strip() == "Filière de formation")
        filiere_type_idx      = next(i for i, h in reversed(list(enumerate(headers))) if h.strip() == "Filière de formation")

        def g(row, name):
            return get_val(row, idx, name)

        for row in raw[1:]:
            if len(row) < 10: continue
            cod = _int(g(row, "cod_aff_form"))
            if not cod: continue

            rows_to_insert.append(ParcoursupFormation(
                cod_aff_form        = cod,
                session             = _int(g(row, "Session")) or 2025,
                etablissement       = (g(row, "Etablissement") or g(row, "Établissement") or "").strip(),
                code_uai            = g(row, "Code UAI de l'etablissement") or g(row, "Code UAI de l'établissement"),
                statut              = g(row, "Statut de l'etablissement de la filiere de formation (public, prive...)") or
                                      g(row, "Statut de l'établissement de la filière de formation (public, privé…)"),
                filiere_agregee     = g(row, "Filiere de formation tres agregee") or
                                      g(row, "Filière de formation très agrégée"),
                filiere_type        = row[filiere_type_idx].strip() or None,
                filiere_specialite  = g(row, "Filiere de formation detaillee bis") or
                                      g(row, "Filière de formation détaillée bis"),
                filiere_detaillee   = row[filiere_detaillee_idx].strip() or None,
                selectivite         = g(row, "Selectivite") or g(row, "Sélectivité"),
                region              = g(row, "Region de l'etablissement") or g(row, "Région de l'établissement"),
                departement         = g(row, "Departement de l'etablissement") or g(row, "Département de l'établissement"),
                commune             = g(row, "Commune de l'etablissement") or g(row, "Commune de l'établissement"),
                capacite            = _int(g(row, "Capacite de l'etablissement par formation") or
                                          g(row, "Capacité de l'établissement par formation")),
                nb_candidats        = _int(g(row, "Effectif total des candidats pour une formation")),
                nb_admis            = _int(g(row, "Effectif total des candidats ayant accepte la proposition de l'etablissement (admis)") or
                                          g(row, "Effectif total des candidats ayant accepté la proposition de l'établissement (admis)")),
                taux_acces          = _float(g(row, "Taux d'acces") or g(row, "Taux d'accès")),
                lien_parcoursup     = g(row, "Lien de la formation sur la plateforme Parcoursup"),
                pct_admis_filles    = _float(g(row, "% d'admis dont filles")),
                pct_boursiers       = _float(g(row, "% d'admis neo bacheliers boursiers") or
                                            g(row, "% d'admis néo bacheliers boursiers")),
                pct_admis_bg        = _float(g(row, "% d'admis neo bacheliers generaux") or
                                            g(row, "% d'admis néo bacheliers généraux")),
                pct_admis_bt        = _float(g(row, "% d'admis neo bacheliers technologiques") or
                                            g(row, "% d'admis néo bacheliers technologiques")),
                pct_admis_bp        = _float(g(row, "% d'admis neo bacheliers professionnels") or
                                            g(row, "% d'admis néo bacheliers professionnels")),
                pct_mention_ab      = _float(g(row, "% d'admis neo bacheliers avec mention Assez Bien au bac") or
                                            g(row, "% d'admis néo bacheliers avec mention Assez Bien au bac")),
                pct_mention_b       = _float(g(row, "% d'admis neo bacheliers avec mention Bien au bac") or
                                            g(row, "% d'admis néo bacheliers avec mention Bien au bac")),
                pct_mention_tb      = _float(g(row, "% d'admis neo bacheliers avec mention Tres Bien au bac") or
                                            g(row, "% d'admis néo bacheliers avec mention Très Bien au bac")),
                pct_mention_tbf     = _float(g(row, "% d'admis neo bacheliers avec mention Tres Bien avec felicitations au bac") or
                                            g(row, "% d'admis néo bacheliers avec mention Très Bien avec félicitations au bac")),
            ))

        db.bulk_save_objects(rows_to_insert)
        db.commit()
        print(f"✓ {len(rows_to_insert)} formations ParcourSup ingérées.")

        # Vérification rapide
        sample = db.query(ParcoursupFormation).filter(
            ParcoursupFormation.pct_admis_bg != None
        ).count()
        print(f"  → {sample} lignes avec pct_admis_bg renseigné.")
    finally:
        db.close()


if __name__ == "__main__":
    ingest()
