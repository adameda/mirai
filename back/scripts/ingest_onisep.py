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
"""

import csv
import re
import sys
import logging
from pathlib import Path
from lxml import etree

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, SessionLocal
from app.models.base import Base
from app.models.onisep import (
    Domaine, Formation, Metier,
    FormationDomaine, FormationMetier, MetierDomaine,
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

# ── Niveaux d'études ciblés (lycéens → post-bac) ─────────────────────────────

NIVEAUX_CIBLES = {"bac + 2", "bac + 3", "bac + 4", "bac + 5"}

# Types de formations inclus même sans description ni texte d'accès.
# Onisep ne remplit pas ces champs pour les écoles d'ingénieurs et de commerce :
# les fiches sont vides mais le nom + niveau + lien Onisep restent utiles.
TYPE_LIBELLE_SANS_CONTENU_OK = {
    "diplôme d'ingénieur",
    "diplôme d'ingénieur spécialisé",
    "diplôme d'école de commerce visé de niveau bac + 4 ou 5",
    "diplôme d'école de commerce visé (bac + 3)",
    "bachelor en sciences et ingénierie",
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
# 18 entrées au lieu des ~200 du mapping précédent.
# Hors scope v1 : "agriculture, animaux" et "armée, sécurité".

MACRO_DOMAINE_MAPPING: dict[str, str] = {
    "informatique, internet":                        "Informatique & Numérique",
    "matières premières, fabrication, industries":   "Ingénierie & Industrie",
    "mécanique":                                     "Ingénierie & Industrie",
    "électricité, électronique, robotique":          "Ingénierie & Industrie",
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
    Les deux clés et valeurs sont en minuscules.
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
) -> tuple[list[dict], list[tuple[str, str]]]:
    """
    Parse le XML formations.
    Retourne :
        - formations : liste de dicts prêts à insérer
        - formation_metier_pairs : [(formation_id, metier_id), ...]
    """
    log.info(f"Parsing formations : {xml_path}")
    tree = etree.parse(str(xml_path))
    root = tree.getroot()

    formations = []
    formation_metier_pairs = []
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

            # Log des sous-domaines non mappables
            sd_key = sd_libelle.lower().strip()
            onisep_macro = sous_to_macro.get(sd_key)
            if not onisep_macro:
                unmapped_sous_domaines.add(sd_libelle)
            elif map_to_mirai(onisep_macro) is None:
                unmapped_sous_domaines.add(f"{sd_libelle} (macro: {onisep_macro})")

        # ── Métiers accessibles depuis cette formation ──
        for metier_elem in elem.findall(".//metiers_formation/metier"):
            metier_id = get_text(metier_elem, "id")
            if metier_id:
                formation_metier_pairs.append((identifiant, metier_id))

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

    return formations, formation_metier_pairs


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

        # ── Synonymes ──
        synonymes = [
            get_text(syn, "nom_metier")
            for syn in elem.findall(".//synonymes/synonyme")
            if get_text(syn, "nom_metier")
        ]

        # ── Secteurs d'activité ──
        secteurs = [
            {"id": get_text(sa, "id"), "libelle": get_text(sa, "libelle")}
            for sa in elem.findall(".//secteur_activite")
            if get_text(sa, "id") and get_text(sa, "libelle")
        ]

        # ── Centres d'intérêt ──
        centres = [
            {"id": get_text(ci, "id"), "libelle": get_text(ci, "libelle")}
            for ci in elem.findall(".//centre_interet")
            if get_text(ci, "id") and get_text(ci, "libelle")
        ]

        # ── Niveau accès min ──
        niveau_elem = elem.find("niveau_acces_min")
        niveau_acces_min = get_text(niveau_elem, "libelle") if niveau_elem is not None else None

        # ── Salaire (dans vie_professionnelle) ──
        salaire = None
        vp_raw = get_text(elem, "vie_professionnelle")
        if vp_raw:
            vp_text = strip_html(vp_raw)
            match = re.search(r"(A partir de .+?euros brut par mois[^.]*)", vp_text or "")
            if match:
                salaire = match.group(1).strip()

        # ── Transversalité ──
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


# ── Ingestion en base ─────────────────────────────────────────────────────────

def ingest():
    log.info("=== Démarrage de l'ingestion Onisep ===")

    Base.metadata.create_all(bind=engine)

    # ── 1. Chargement des mappings CSV ──
    log.info("Chargement des mappings CSV...")
    sous_to_macro = build_sous_domaine_to_macro(CSV_FORMATIONS)
    metier_domaines = load_metier_domaines(CSV_METIERS)

    # ── 2. Parse des XML ──
    formations_data, fm_pairs = parse_formations(XML_FORMATIONS, sous_to_macro)
    metiers_data = parse_metiers(XML_METIERS)

    db = SessionLocal()
    try:
        # ── 3. Purge des données Onisep existantes ──
        log.info("Purge des données Onisep existantes...")
        # Les favoris référencent formations, métiers et domaines — à supprimer en premier.
        # Ils seront de toute façon invalides après une réingestion (IDs recréés).
        nb_favoris = db.query(Favori).delete()
        if nb_favoris:
            log.warning(f"  {nb_favoris} favori(s) supprimé(s) (invalidés par la réingestion)")
        db.execute(MetierDomaine.delete())
        db.execute(FormationMetier.delete())
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

        # ── 5. Insertion des formations + liens formation ↔ domaine ──
        log.info(f"Insertion de {len(formations_data)} formations...")
        formation_by_id: dict[str, Formation] = {}
        formations_sans_domaine = 0

        for fdata in formations_data:
            sous_domaines = fdata.pop("sous_domaines")
            f = Formation(**fdata)

            mirai_libelles_vus: set[str] = set()
            for _, sd_libelle in sous_domaines:
                # Étape 1 : sous_domaine → macro Onisep (depuis CSV)
                onisep_macro = sous_to_macro.get(sd_libelle.lower().strip())
                if not onisep_macro:
                    continue
                # Étape 2 : macro Onisep → domaine Mirai
                mirai_libelle = map_to_mirai(onisep_macro)
                if mirai_libelle and mirai_libelle not in mirai_libelles_vus:
                    domaine_obj = domaine_by_libelle.get(mirai_libelle)
                    if domaine_obj:
                        f.domaines.append(domaine_obj)
                        mirai_libelles_vus.add(mirai_libelle)

            if not mirai_libelles_vus:
                formations_sans_domaine += 1

            db.add(f)
            formation_by_id[f.id] = f

        db.flush()
        if formations_sans_domaine:
            log.warning(f"  Formations sans domaine (hors scope) : {formations_sans_domaine}")

        # ── 6. Insertion des métiers ──
        log.info(f"Insertion de {len(metiers_data)} métiers...")
        metier_by_id: dict[str, Metier] = {}
        for mdata in metiers_data:
            m = Metier(**mdata)
            db.add(m)
            metier_by_id[m.id] = m
        db.flush()

        # ── 7. Liens formation ↔ métier ──
        log.info(f"Création des liens formation↔métier ({len(fm_pairs)} paires brutes)...")
        seen_pairs: set[tuple[str, str]] = set()
        nb_liens_fm = 0
        for formation_id, metier_id in fm_pairs:
            pair = (formation_id, metier_id)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            formation = formation_by_id.get(formation_id)
            metier = metier_by_id.get(metier_id)
            if formation and metier:
                formation.metiers.append(metier)
                nb_liens_fm += 1
        log.info(f"  Liens formation↔métier créés : {nb_liens_fm}")

        # ── 8. Liens métier ↔ domaine (depuis CSV) ──
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
