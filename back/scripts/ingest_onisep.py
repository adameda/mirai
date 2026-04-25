#!/usr/bin/env python3
"""
Script d'ingestion des fiches Onisep (XML formations + XML métiers + CSV métiers).

Usage (depuis le dossier back/) :
    python -m scripts.ingest_onisep

Prérequis :
    - PostgreSQL lancé, base "mirai" créée
    - .env configuré (DATABASE_URL)
    - pip install -r requirements.txt

Ce script est idempotent : relancer efface et recrée toutes les données Onisep.
Les données utilisateurs (comptes, favoris, classes) ne sont PAS touchées.

Architecture du mapping :
    XML formations → sous_domaine_web → [CSV] → macro-domaine Onisep → [MACRO_DOMAINE_MAPPING] → domaine Mirai
    CSV métiers    → domaine/sous-domaine       → [MACRO_DOMAINE_MAPPING] → domaine Mirai
    YAML manuel    → domaines explicites (CPGE, CPI, PASS, LAS, IFSI)
"""

import csv
import re
import sys
import logging
from collections import Counter
from pathlib import Path
from lxml import etree
from sqlalchemy import text
import yaml

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, SessionLocal
from app.models.base import Base
from app.models.onisep import (
    Domaine, Formation, Metier,
    FormationDomaine, MetierDomaine,
)
from app.models.favori import Favori

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Chemins ──────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent.parent / "data"
XML_FORMATIONS = DATA_DIR / "Onisep_Ideo_Fiches_Formations_10022026.xml"
XML_METIERS    = DATA_DIR / "Onisep_Ideo_Fiches_Metiers_10022026.xml"
CSV_FORMATIONS = DATA_DIR / "ideo-formations_initiales_en_france.csv"
CSV_METIERS    = DATA_DIR / "ideo-metiers_onisep.csv"
YAML_MANUEL    = DATA_DIR / "manuel_formations.yaml"

# ── Niveaux d'études ciblés (lycéens → post-bac) ─────────────────────────────

NIVEAUX_CIBLES = {"bac + 2", "bac + 3", "bac + 4", "bac + 5"}

# Types ingérés même sans description ni texte d'accès.
# Onisep ne remplit pas ces champs pour les écoles d'ingénieurs et de commerce,
# mais le nom + niveau + lien restent utiles pour le chatbot.
TYPE_LIBELLE_SANS_CONTENU_OK = {
    "diplôme d'ingénieur",
    "diplôme d'ingénieur spécialisé",
    "diplôme d'école de commerce visé de niveau bac + 4 ou 5",
    "diplôme d'école de commerce visé (bac + 3)",
    "bachelor en sciences et ingénierie",
}

# Types accessibles directement depuis le bac → col2 de la page Exploration.
# BTSA exclu : filière agricole, aucun domaine Mirai correspondant.
# CPGE et CPI absents du XML Onisep → gérés via YAML manuel.
TYPES_COL2 = {
    "brevet de technicien supérieur",
    "bachelor universitaire de technologie",
    "licence",
    "diplôme national des métiers d'art et du design",
    "diplôme national supérieur professionnel",
    "diplôme national supérieur d'expression plastique",
    "diplôme national d'art",
    "diplôme supérieur d'arts appliqués",
    "diplôme d'état du paramédical",
    "autre formation en santé",
    "diplôme des écoles d'architecture",
    "diplôme d'état en art",
    "diplôme d'état du travail social",
    "diplôme d'iep",
    "diplôme universitaire de musicien intervenant",
}

# ── 13 domaines Mirai ────────────────────────────────────────────────────────

MIRAI_DOMAINES = [
    ("Informatique & Numérique",     "informatique-numerique"),
    ("Ingénierie & Industrie",       "ingenierie-industrie"),
    ("Énergie & Environnement",      "energie-environnement"),
    ("Commerce & Marketing",         "commerce-marketing"),
    ("Gestion & Finance",            "gestion-finance"),
    ("Communication & Médias",       "communication-medias"),
    ("Arts & Design",                "arts-design"),
    ("Santé & Social",               "sante-social"),
    ("Sciences",                     "sciences"),
    ("Droit",                        "droit"),
    ("Sciences Humaines & Langues",  "sciences-humaines-langues"),
    ("BTP & Architecture",           "btp-architecture"),
    ("Hôtellerie & Tourisme",        "hotellerie-tourisme"),
]

# ── Mapping macro-domaine Onisep (minuscules) → domaine Mirai ────────────────
# "agriculture, animaux" : hors scope (pas de domaine Mirai agriculture).
# "armée, sécurité" : mappé vers Ingénierie pour couvrir le BTS Sécurité.

MACRO_DOMAINE_MAPPING: dict[str, str] = {
    "informatique, internet":                        "Informatique & Numérique",
    "matières premières, fabrication, industries":   "Ingénierie & Industrie",
    "mécanique":                                     "Ingénierie & Industrie",
    "électricité, électronique, robotique":          "Ingénierie & Industrie",
    "armée, sécurité":                               "Ingénierie & Industrie",
    "environnement, énergies, propreté":             "Énergie & Environnement",
    "commerce, marketing, vente":                    "Commerce & Marketing",
    "logistique, transport":                         "Commerce & Marketing",
    "gestion des entreprises, comptabilité":         "Gestion & Finance",
    "banque, assurances, immobilier":                "Gestion & Finance",
    "information-communication, audiovisuel":        "Communication & Médias",
    "arts, culture, artisanat":                      "Arts & Design",
    "santé, social, sport":                          "Santé & Social",
    "sciences":                                      "Sciences",
    "économie, droit, politique":                    "Droit",
    "lettres, langues, enseignement":                "Sciences Humaines & Langues",
    "histoire-géographie, psychologie, sociologie":  "Sciences Humaines & Langues",
    "construction, architecture, travaux publics":   "BTP & Architecture",
    "hôtellerie-restauration, tourisme":             "Hôtellerie & Tourisme",
}

# ── Chargement des mappings CSV ───────────────────────────────────────────────

def build_sous_domaine_to_macro(csv_path: Path) -> dict[str, str]:
    """
    Construit le mapping sous_domaine_web → macro-domaine Onisep depuis le CSV formations.
    Ex : "informatique (généralités)" → "informatique, internet"
    """
    sous_to_macro: dict[str, str] = {}
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            ds = row.get("domaine/sous-domaine", "")
            if not ds:
                continue
            for part in ds.split("|"):
                part = part.strip()
                if "/" not in part:
                    continue
                macro, sous = part.split("/", 1)
                key = sous.strip().lower()
                if key not in sous_to_macro:
                    sous_to_macro[key] = macro.strip().lower()
    log.info(f"  Mapping sous-domaines chargé : {len(sous_to_macro)} entrées")
    return sous_to_macro


def load_metier_domaines(csv_path: Path) -> dict[str, set[str]]:
    """
    Charge le mapping metier_id → set[macro_domaine_onisep] depuis le CSV métiers.
    L'identifiant MET.XXX est extrait de l'URL Onisep présente dans le CSV.
    """
    metier_domaines: dict[str, set[str]] = {}
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            url = row.get("lien site onisep.fr", "")
            m = re.search(r"MET\.(\d+)", url)
            if not m:
                continue
            met_id = "MET." + m.group(1)

            ds = row.get("domaine/sous-domaine", "")
            macros: set[str] = set()
            for part in ds.split("|"):
                part = part.strip()
                if "/" in part:
                    macro = part.split("/")[0].strip().lower()
                    macros.add(macro)
            if macros:
                metier_domaines[met_id] = macros
    log.info(f"  Domaines métiers chargés depuis CSV : {len(metier_domaines)} métiers")
    return metier_domaines


def map_to_mirai(onisep_macro: str) -> str | None:
    """Mappe un macro-domaine Onisep (en minuscules) vers un domaine Mirai."""
    return MACRO_DOMAINE_MAPPING.get(onisep_macro.strip().lower())


# ── Utilitaires XML ───────────────────────────────────────────────────────────

def strip_html(html_text: str | None) -> str | None:
    """Supprime les balises HTML et normalise les espaces."""
    if not html_text or not html_text.strip():
        return None
    clean = re.sub(r"<[^>]+>", " ", html_text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean or None


def get_text(element, tag: str) -> str | None:
    """Retourne le texte d'un tag enfant, ou None."""
    child = element.find(tag)
    if child is None or not child.text:
        return None
    return child.text.strip() or None


def clean_duree(duree: str | None) -> str | None:
    """Retire les guillemets autour de la durée."""
    if not duree:
        return None
    return duree.strip('"').strip("'").strip() or None


# ── Parsing formations ────────────────────────────────────────────────────────

def parse_formations(
    xml_path: Path,
    sous_to_macro: dict[str, str],
) -> list[dict]:
    """
    Parse le XML formations. Retourne une liste de dicts prêts à insérer.
    Seules les formations bac+2→+5 ayant du contenu (ou un type explicitement
    accepté sans contenu) sont retenues.
    """
    log.info(f"Parsing formations : {xml_path}")
    tree = etree.parse(str(xml_path))
    root = tree.getroot()

    formations = []
    skipped_niveau = 0
    skipped_content = 0
    unmapped_sous_domaines: set[str] = set()

    for elem in root.findall("formation"):
        identifiant = get_text(elem, "identifiant")
        if not identifiant:
            continue

        # ── Niveau d'études ──
        niveau_elem = elem.find("niveau_etudes")
        niveau_etudes = get_text(niveau_elem, "libelle") if niveau_elem is not None else None
        if niveau_etudes not in NIVEAUX_CIBLES:
            skipped_niveau += 1
            continue

        # ── Type de formation ──
        type_elem = elem.find("type_Formation")
        type_sigle         = get_text(type_elem, "type_formation_sigle")           if type_elem is not None else None
        type_libelle_court = get_text(type_elem, "type_formation_libelle_court")   if type_elem is not None else None
        type_libelle       = get_text(type_elem, "type_formation_libelle")         if type_elem is not None else None

        # ── Champs texte ──
        description_courte = strip_html(get_text(elem, "descriptif_format_court"))
        acces = strip_html(get_text(elem, "descriptif_acces"))

        if not description_courte and not acces:
            if type_libelle not in TYPE_LIBELLE_SANS_CONTENU_OK:
                skipped_content += 1
                continue

        # ── Poursuites d'études ──
        poursuites = []
        for pe in elem.findall(".//formation_poursuite_Etudes"):
            pe_id = pe.get("id")
            pe_libelle = pe.text.strip() if pe.text else None
            if pe_id and pe_libelle:
                poursuites.append({"id": pe_id, "libelle": pe_libelle})

        # ── Sous-domaines (pour le mapping domaine) ──
        sous_domaines_raw = []
        for sd in elem.findall(".//sous_domaine_web"):
            sd_id = get_text(sd, "id")
            sd_libelle = get_text(sd, "libelle")
            if not sd_libelle:
                continue
            sous_domaines_raw.append((sd_id, sd_libelle))

            sd_key = sd_libelle.lower().strip()
            onisep_macro = sous_to_macro.get(sd_key)
            if not onisep_macro:
                unmapped_sous_domaines.add(sd_libelle)
            elif map_to_mirai(onisep_macro) is None:
                unmapped_sous_domaines.add(f"{sd_libelle} (macro: {onisep_macro})")

        formations.append({
            "id": identifiant,
            "libelle_complet": get_text(elem, "libelle_complet") or identifiant,
            "libelle_generique": get_text(elem, "libelle_generique"),
            "libelle_specifique": get_text(elem, "libelle_specifique"),
            "type_sigle": type_sigle,
            "type_libelle_court": type_libelle_court,
            "type_libelle": type_libelle,
            "duree": clean_duree(get_text(elem, "duree_formation")),
            "niveau_etudes": niveau_etudes,
            "niveau_certification": get_text(elem, "niveau_certification"),
            "description_courte": description_courte,
            "acces": acces,
            "attendus": strip_html(get_text(elem, "attendus")),
            "poursuite_etudes": poursuites or None,
            "url": get_text(elem, "url"),
            "acces_postbac_direct": (type_libelle or "").lower().strip() in TYPES_COL2,
            "sous_domaines": sous_domaines_raw,
        })

    log.info(
        f"  Formations retenues : {len(formations)} "
        f"(ignorées niveau : {skipped_niveau}, ignorées contenu : {skipped_content})"
    )
    if unmapped_sous_domaines:
        log.warning(
            f"  Sous-domaines hors scope ou non mappés ({len(unmapped_sous_domaines)}) : "
            f"{sorted(unmapped_sous_domaines)}"
        )

    return formations


# ── Parsing métiers ───────────────────────────────────────────────────────────

def parse_metiers(xml_path: Path) -> list[dict]:
    """Parse le XML métiers. Retourne une liste de dicts prêts à insérer."""
    log.info(f"Parsing métiers : {xml_path}")
    tree = etree.parse(str(xml_path))
    root = tree.getroot()

    metiers = []

    for elem in root.findall("metier"):
        identifiant = get_text(elem, "identifiant")
        if not identifiant:
            continue

        synonymes = [
            get_text(syn, "nom_metier")
            for syn in elem.findall(".//synonymes/synonyme")
            if get_text(syn, "nom_metier")
        ]

        secteurs = [
            {"id": get_text(sa, "id"), "libelle": get_text(sa, "libelle")}
            for sa in elem.findall(".//secteur_activite")
            if get_text(sa, "id") and get_text(sa, "libelle")
        ]

        centres = [
            {"id": get_text(ci, "id"), "libelle": get_text(ci, "libelle")}
            for ci in elem.findall(".//centre_interet")
            if get_text(ci, "id") and get_text(ci, "libelle")
        ]

        niveau_elem = elem.find("niveau_acces_min")
        niveau_acces_min = get_text(niveau_elem, "libelle") if niveau_elem is not None else None

        salaire = None
        vp_raw = get_text(elem, "vie_professionnelle")
        if vp_raw:
            vp_text = strip_html(vp_raw)
            match = re.search(r"(A partir de .+?euros brut par mois[^.]*)", vp_text or "")
            if match:
                salaire = match.group(1).strip()

        transverse_elem = elem.find(".//metier_transverse")
        est_transverse = (
            transverse_elem is not None
            and transverse_elem.text
            and transverse_elem.text.strip().lower() == "oui"
        )

        metiers.append({
            "id": identifiant,
            "nom": get_text(elem, "nom_metier") or identifiant,
            "libelle_feminin": get_text(elem, "libelle_feminin"),
            "libelle_masculin": get_text(elem, "libelle_masculin"),
            "synonymes": synonymes or None,
            "secteurs_activite": secteurs or None,
            "centres_interet": centres or None,
            "niveau_acces_min": niveau_acces_min,
            "salaire_debutant": salaire,
            "accroche": strip_html(get_text(elem, "accroche_metier")),
            "format_court": strip_html(get_text(elem, "format_court")),
            "competences": strip_html(get_text(elem, "competences")),
            "nature_travail": strip_html(get_text(elem, "nature_travail")),
            "condition_travail": strip_html(get_text(elem, "condition_travail")),
            "est_transverse": est_transverse,
        })

    log.info(f"  Métiers retenus : {len(metiers)}")
    return metiers


# ── Parsing YAML manuel ───────────────────────────────────────────────────────

def parse_yaml_manuel(yaml_path: Path, existing_ids: set[str]) -> list[dict]:
    """
    Charge le fichier YAML de formations manuelles (CPGE, CPI, PASS, LAS, IFSI).
    Ignore silencieusement les entrées dont l'id est déjà connu.
    """
    if not yaml_path.exists():
        log.warning(f"Fichier YAML manuel introuvable : {yaml_path}")
        return []

    log.info(f"Parsing YAML manuel : {yaml_path}")
    with open(yaml_path, encoding="utf-8") as f:
        entries = yaml.safe_load(f) or []

    formations = []
    for entry in entries:
        fid = entry.get("id")
        if not fid or fid in existing_ids:
            continue
        formations.append({
            "id": fid,
            "libelle_complet": entry.get("libelle_complet", fid),
            "libelle_generique": entry.get("libelle_generique"),
            "libelle_specifique": None,
            "type_sigle": entry.get("type_sigle"),
            "type_libelle_court": entry.get("type_sigle"),
            "type_libelle": entry.get("type_libelle"),
            "duree": entry.get("duree"),
            "niveau_etudes": entry.get("niveau_etudes"),
            "niveau_certification": None,
            "description_courte": entry.get("description_courte", "").strip() or None,
            "acces": None,
            "attendus": None,
            "poursuite_etudes": entry.get("poursuite_etudes") or None,
            "url": entry.get("url"),
            "acces_postbac_direct": entry.get("acces_postbac_direct", False),
            "mirai_domaines": set(entry.get("domaines", [])),
        })

    log.info(f"  Formations manuelles retenues : {len(formations)}")
    return formations


# ── Ingestion en base ─────────────────────────────────────────────────────────

def ingest():
    log.info("=== Démarrage de l'ingestion Onisep ===")

    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE formations "
            "ADD COLUMN IF NOT EXISTS acces_postbac_direct BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        conn.execute(text("ALTER TABLE formations ALTER COLUMN id TYPE VARCHAR(40)"))
        # Suppression de l'ancienne table de liaison formation↔métier (design v1, plus utilisée)
        conn.execute(text("DROP TABLE IF EXISTS formation_metier CASCADE"))
        conn.commit()
    log.info("Migrations OK")

    # ── 1. Chargement des mappings CSV ──
    log.info("Chargement des mappings CSV...")
    sous_to_macro = build_sous_domaine_to_macro(CSV_FORMATIONS)
    metier_domaines = load_metier_domaines(CSV_METIERS)

    # ── 2. Parse des sources ──
    formations_data = parse_formations(XML_FORMATIONS, sous_to_macro)
    metiers_data = parse_metiers(XML_METIERS)

    xml_formation_ids = {fdata["id"] for fdata in formations_data}
    yaml_manuel = parse_yaml_manuel(YAML_MANUEL, xml_formation_ids)

    db = SessionLocal()
    try:
        # ── 3. Purge des données Onisep existantes ──
        log.info("Purge des données Onisep existantes...")
        nb_favoris = db.query(Favori).delete()
        if nb_favoris:
            log.warning(f"  {nb_favoris} favori(s) supprimé(s) (invalidés par la réingestion)")
        db.execute(MetierDomaine.delete())
        db.execute(FormationDomaine.delete())
        db.query(Formation).delete()
        db.query(Metier).delete()
        db.query(Domaine).delete()
        db.commit()

        # ── 4. Seed des 13 domaines Mirai ──
        log.info(f"Insertion des {len(MIRAI_DOMAINES)} domaines Mirai...")
        domaine_by_libelle: dict[str, Domaine] = {}
        for libelle, slug in MIRAI_DOMAINES:
            d = Domaine(libelle=libelle, slug=slug)
            db.add(d)
            domaine_by_libelle[libelle] = d
        db.flush()

        # ── 5. Insertion des formations XML + liens formation ↔ domaine ──
        log.info(f"Insertion de {len(formations_data)} formations XML...")
        formation_by_id: dict[str, Formation] = {}
        formations_sans_domaine = 0

        for fdata in formations_data:
            sous_domaines = fdata.pop("sous_domaines")
            f = Formation(**fdata)

            # Score par domaine Mirai : nb de sous-domaines pointant vers ce domaine
            mirai_scores: Counter = Counter()
            for _, sd_libelle in sous_domaines:
                onisep_macro = sous_to_macro.get(sd_libelle.lower().strip())
                if not onisep_macro:
                    continue
                mirai_libelle = map_to_mirai(onisep_macro)
                if mirai_libelle:
                    mirai_scores[mirai_libelle] += 1

            # IEP : domaines fixés indépendamment des sous-domaines Onisep
            # (très généralistes, leurs sous-domaines couvrent jusqu'à 9 domaines Mirai)
            if (f.type_libelle or "").lower().strip() == "diplôme d'iep":
                top_domaines = ["Droit", "Sciences Humaines & Langues"]
            else:
                top_domaines = [d for d, _ in mirai_scores.most_common(2)]

            for mirai_libelle in top_domaines:
                domaine_obj = domaine_by_libelle.get(mirai_libelle)
                if domaine_obj:
                    f.domaines.append(domaine_obj)

            if not f.domaines:
                formations_sans_domaine += 1

            db.add(f)
            formation_by_id[f.id] = f

        db.flush()
        if formations_sans_domaine:
            log.warning(f"  Formations sans domaine (hors scope) : {formations_sans_domaine}")

        # ── 5b. Insertion des formations YAML manuelles ──
        log.info(f"Insertion de {len(yaml_manuel)} formations manuelles (CPGE/CPI/PASS/LAS/IFSI)...")
        for fdata in yaml_manuel:
            mirai_domaines = fdata.pop("mirai_domaines")
            f = Formation(**fdata)
            for mirai_libelle in mirai_domaines:
                domaine_obj = domaine_by_libelle.get(mirai_libelle)
                if domaine_obj:
                    f.domaines.append(domaine_obj)
            db.add(f)
            formation_by_id[f.id] = f
        db.flush()

        # ── 6. Insertion des métiers ──
        log.info(f"Insertion de {len(metiers_data)} métiers...")
        metier_by_id: dict[str, Metier] = {}
        for mdata in metiers_data:
            m = Metier(**mdata)
            db.add(m)
            metier_by_id[m.id] = m
        db.flush()

        # ── 7. Liens métier ↔ domaine (depuis CSV) ──
        log.info("Création des liens métier↔domaine depuis le CSV...")
        nb_liens_md = 0
        metiers_sans_domaine = 0
        for met_id, onisep_macros in metier_domaines.items():
            metier = metier_by_id.get(met_id)
            if not metier:
                continue
            mirai_libelles_vus: set[str] = set()
            for onisep_macro in onisep_macros:
                mirai_libelle = map_to_mirai(onisep_macro)
                if mirai_libelle and mirai_libelle not in mirai_libelles_vus:
                    domaine_obj = domaine_by_libelle.get(mirai_libelle)
                    if domaine_obj:
                        metier.domaines.append(domaine_obj)
                        mirai_libelles_vus.add(mirai_libelle)
                        nb_liens_md += 1
            if not mirai_libelles_vus:
                metiers_sans_domaine += 1
        log.info(f"  Liens métier↔domaine créés : {nb_liens_md}")
        if metiers_sans_domaine:
            log.warning(f"  Métiers sans domaine (hors scope) : {metiers_sans_domaine}")

        db.commit()
        log.info("=== Ingestion terminée avec succès ===")

    except Exception as e:
        db.rollback()
        log.error(f"Erreur lors de l'ingestion : {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    ingest()
