#!/usr/bin/env python3
"""
Script d'ingestion des fiches Onisep XML.

Usage (depuis le dossier back/) :
    python -m scripts.ingest_onisep

Prérequis :
    - PostgreSQL lancé, base "mirai" créée
    - .env configuré (DATABASE_URL)
    - pip install -r requirements.txt

Ce script est idempotent : relancer efface et recrée toutes les données Onisep.
Les données utilisateurs (comptes, favoris, classes) ne sont PAS touchées.
"""

import re
import sys
import logging
from pathlib import Path
from lxml import etree

# Ajoute le dossier back/ au path pour importer app/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, SessionLocal
from app.models.base import Base
from app.models.onisep import Domaine, Formation, Metier, FormationDomaine, FormationMetier

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Chemins XML ────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent.parent / "data"
XML_FORMATIONS = DATA_DIR / "Onisep_Ideo_Fiches_Formations_10022026.xml"
XML_METIERS = DATA_DIR / "Onisep_Ideo_Fiches_Metiers_10022026.xml"

# ── Niveaux d'études ciblés (lycéens → post-bac) ──────────────────────────

NIVEAUX_CIBLES = {"bac + 2", "bac + 3", "bac + 4", "bac + 5"}

# ── Macro-domaines Mirai ───────────────────────────────────────────────────

MACRO_DOMAINES = [
    ("Informatique & Tech",         "informatique-tech"),
    ("Ingénierie & Industries",     "ingenierie-industries"),
    ("Énergie & Environnement",     "energie-environnement"),
    ("Sciences",                    "sciences"),
    ("Commerce & Gestion",          "commerce-gestion"),
    ("Arts & Design",               "arts-design"),
    ("BTP & Architecture",          "btp-architecture"),
    ("Santé & Social",              "sante-social"),
    ("Droit & Sécurité",            "droit-securite"),
    ("Agriculture & Agroalimentaire", "agriculture-agroalimentaire"),
    ("Communication & Médias",      "communication-medias"),
    ("Finance & Assurance",         "finance-assurance"),
    ("Enseignement & Formation",    "enseignement-formation"),
    ("Hôtellerie & Tourisme",       "hotellerie-tourisme"),
    ("Sport & Animation",           "sport-animation"),
]

# ── Mapping sous_domaine_web (Onisep) → macro-domaine Mirai ───────────────
# Clé : libellé exact du sous_domaine_web dans le XML
# Valeur : libellé du macro-domaine Mirai

SOUS_DOMAINE_MAPPING: dict[str, str] = {
    # Informatique & Tech
    "informatique (généralités)":               "Informatique & Tech",
    "systèmes et réseaux":                      "Informatique & Tech",
    "bases de données":                         "Informatique & Tech",
    "développement, programmation, logiciel":   "Informatique & Tech",
    "études et développement":                  "Informatique & Tech",
    "multimédia":                               "Informatique & Tech",
    "télécommunications":                       "Informatique & Tech",
    "informatique de gestion":                  "Informatique & Tech",
    "intelligence artificielle":               "Informatique & Tech",
    "cybersécurité":                            "Informatique & Tech",
    "réseaux informatiques":                    "Informatique & Tech",

    # Ingénierie & Industries
    "électronique":                             "Ingénierie & Industries",
    "maintenance, qualité":                     "Ingénierie & Industries",
    "fonction production (généralités)":        "Ingénierie & Industries",
    "mécanique (généralités)":                  "Ingénierie & Industries",
    "automatismes":                             "Ingénierie & Industries",
    "méthodes industrialisation":               "Ingénierie & Industries",
    "aéronautique":                             "Ingénierie & Industries",
    "génie industriel":                         "Ingénierie & Industries",
    "matériaux":                                "Ingénierie & Industries",
    "robotique":                                "Ingénierie & Industries",
    "génie électrique":                         "Ingénierie & Industries",
    "génie mécanique":                          "Ingénierie & Industries",
    "automobile":                               "Ingénierie & Industries",
    "aéronautique, spatial":                    "Ingénierie & Industries",
    "construction navale":                      "Ingénierie & Industries",
    "ferroviaire":                              "Ingénierie & Industries",
    "plasturgie":                               "Ingénierie & Industries",
    "métallurgie":                              "Ingénierie & Industries",
    "textile":                                  "Ingénierie & Industries",
    "imprimerie":                               "Ingénierie & Industries",
    "industrie (généralités)":                  "Ingénierie & Industries",

    # Énergie & Environnement
    "énergies":                                 "Énergie & Environnement",
    "environnement (généralités)":              "Énergie & Environnement",
    "développement durable":                    "Énergie & Environnement",
    "énergies renouvelables":                   "Énergie & Environnement",
    "traitement des eaux":                      "Énergie & Environnement",
    "traitement des déchets":                   "Énergie & Environnement",
    "nucléaire":                                "Énergie & Environnement",

    # Sciences
    "physique":                                 "Sciences",
    "chimie":                                   "Sciences",
    "biologie":                                 "Sciences",
    "mathématiques":                            "Sciences",
    "sciences de la vie et de la terre":        "Sciences",
    "biochimie":                                "Sciences",
    "sciences physiques":                       "Sciences",
    "géologie":                                 "Sciences",
    "sciences économiques":                     "Sciences",
    "statistiques":                             "Sciences",

    # Commerce & Gestion
    "administration de l'entreprise":           "Commerce & Gestion",
    "marketing, vente":                         "Commerce & Gestion",
    "logistique":                               "Commerce & Gestion",
    "transport":                                "Commerce & Gestion",
    "commerce (généralités)":                   "Commerce & Gestion",
    "commerce international":                   "Commerce & Gestion",
    "gestion des entreprises":                  "Commerce & Gestion",
    "ressources humaines":                      "Commerce & Gestion",
    "management":                               "Commerce & Gestion",
    "entrepreneuriat":                          "Commerce & Gestion",
    "achats":                                   "Commerce & Gestion",

    # Arts & Design
    "arts graphiques":                          "Arts & Design",
    "artisanat d'art":                          "Arts & Design",
    "design":                                   "Arts & Design",
    "mode":                                     "Arts & Design",
    "arts plastiques":                          "Arts & Design",
    "cinéma, audiovisuel":                      "Arts & Design",
    "musique":                                  "Arts & Design",
    "arts du spectacle":                        "Arts & Design",
    "photographie":                             "Arts & Design",
    "décoration":                               "Arts & Design",
    "architecture intérieure":                  "Arts & Design",
    "bijouterie, joaillerie":                   "Arts & Design",
    "lutherie":                                 "Arts & Design",
    "ébénisterie":                              "Arts & Design",

    # BTP & Architecture
    "génie civil, construction (généralités)":  "BTP & Architecture",
    "bâtiment (généralités)":                   "BTP & Architecture",
    "architecture":                             "BTP & Architecture",
    "urbanisme":                                "BTP & Architecture",
    "topographie":                              "BTP & Architecture",
    "travaux publics":                          "BTP & Architecture",
    "géomètre":                                 "BTP & Architecture",
    "paysage":                                  "BTP & Architecture",
    "mines et carrières":                       "BTP & Architecture",

    # Santé & Social
    "santé (généralités)":                      "Santé & Social",
    "médecine":                                 "Santé & Social",
    "soins infirmiers":                         "Santé & Social",
    "pharmacie":                                "Santé & Social",
    "kinésithérapie":                           "Santé & Social",
    "biologie médicale":                        "Santé & Social",
    "paramédical (généralités)":                "Santé & Social",
    "action sociale":                           "Santé & Social",
    "travail social":                           "Santé & Social",
    "aide à la personne":                       "Santé & Social",
    "psychologie":                              "Santé & Social",
    "orthophonie":                              "Santé & Social",
    "ergothérapie":                             "Santé & Social",
    "optique":                                  "Santé & Social",
    "dentaire":                                 "Santé & Social",
    "vétérinaire":                              "Santé & Social",

    # Droit & Sécurité
    "droit":                                    "Droit & Sécurité",
    "justice":                                  "Droit & Sécurité",
    "sécurité publique":                        "Droit & Sécurité",
    "défense":                                  "Droit & Sécurité",
    "notariat":                                 "Droit & Sécurité",
    "police, gendarmerie":                      "Droit & Sécurité",

    # Agriculture & Agroalimentaire
    "agroalimentaire":                          "Agriculture & Agroalimentaire",
    "agriculture (généralités)":                "Agriculture & Agroalimentaire",
    "viticulture, oenologie":                   "Agriculture & Agroalimentaire",
    "horticulture":                             "Agriculture & Agroalimentaire",
    "élevage":                                  "Agriculture & Agroalimentaire",
    "sylviculture, forêts":                     "Agriculture & Agroalimentaire",
    "pêche":                                    "Agriculture & Agroalimentaire",
    "cuisine, art culinaire":                   "Agriculture & Agroalimentaire",

    # Communication & Médias
    "communication (généralités)":              "Communication & Médias",
    "journalisme":                              "Communication & Médias",
    "édition":                                  "Communication & Médias",
    "information et documentation":             "Communication & Médias",
    "relations publiques":                      "Communication & Médias",
    "traduction":                               "Communication & Médias",
    "langues":                                  "Communication & Médias",

    # Finance & Assurance
    "comptabilité, gestion financière":         "Finance & Assurance",
    "banque, finance":                          "Finance & Assurance",
    "assurance":                                "Finance & Assurance",
    "audit, contrôle de gestion":               "Finance & Assurance",

    # Enseignement & Formation
    "enseignement (généralités)":               "Enseignement & Formation",
    "formation":                                "Enseignement & Formation",
    "éducation":                                "Enseignement & Formation",

    # Hôtellerie & Tourisme
    "hôtellerie":                               "Hôtellerie & Tourisme",
    "tourisme":                                 "Hôtellerie & Tourisme",
    "restauration":                             "Hôtellerie & Tourisme",
    "boulangerie, pâtisserie":                  "Hôtellerie & Tourisme",

    # Sport & Animation
    "sport (généralités)":                      "Sport & Animation",
    "animation":                                "Sport & Animation",
    "activités physiques et sportives":         "Sport & Animation",
    "jeunesse, éducation populaire":            "Sport & Animation",
    "sport":                                    "Sport & Animation",

    # Informatique & Tech (suppléments)
    "informatique industrielle et technologique": "Informatique & Tech",
    "informatique pour la recherche":           "Informatique & Tech",

    # Ingénierie & Industries (suppléments)
    "fabrication, productique":                 "Ingénierie & Industries",
    "métallurgie, sidérurgie":                  "Ingénierie & Industries",
    "travail des métaux":                       "Ingénierie & Industries",
    "électrotechnique":                         "Ingénierie & Industries",
    "bois":                                     "Ingénierie & Industries",
    "céramique, composites":                    "Ingénierie & Industries",
    "papier, carton":                           "Ingénierie & Industries",
    "verre":                                    "Ingénierie & Industries",
    "cycle, moto":                              "Ingénierie & Industries",
    "engins":                                   "Ingénierie & Industries",
    "équipement technique":                     "Ingénierie & Industries",
    "textile, habillement":                     "Ingénierie & Industries",

    # Énergie & Environnement (suppléments)
    "déchets, pollutions et risques":           "Énergie & Environnement",
    "gestion de l'eau":                         "Énergie & Environnement",
    "protection des espaces naturels":          "Énergie & Environnement",

    # Sciences (suppléments)
    "géographie":                               "Sciences",
    "histoire":                                 "Sciences",
    "philosophie":                              "Sciences",
    "sciences de la Terre":                     "Sciences",
    "sciences humaines et sociales (généralités)": "Sciences",
    "sciences politiques":                      "Sciences",
    "sciences sociales":                        "Sciences",

    # Commerce & Gestion (suppléments)
    "achat, approvisionnement":                 "Commerce & Gestion",
    "grande distribution et petits commerces":  "Commerce & Gestion",
    "secrétariat":                              "Commerce & Gestion",
    "propreté":                                 "Commerce & Gestion",

    # Arts & Design (suppléments)
    "activités culturelles":                    "Arts & Design",
    "arts appliqués":                           "Arts & Design",
    "histoire de l'art":                        "Arts & Design",
    "restauration d'art":                       "Arts & Design",
    "ameublement":                              "Arts & Design",
    "audiovisuel":                              "Communication & Médias",

    # BTP & Architecture (suppléments)
    "agencement":                               "BTP & Architecture",
    "aménagement du territoire":                "BTP & Architecture",
    "aménagement paysager":                     "BTP & Architecture",
    "bureau d'études BTP":                      "BTP & Architecture",
    "charpente, couverture":                    "BTP & Architecture",
    "finition":                                 "BTP & Architecture",
    "génie civil":                              "BTP & Architecture",
    "immobilier":                               "BTP & Architecture",
    "menuiserie":                               "BTP & Architecture",
    "plâtrerie":                                "BTP & Architecture",

    # Santé & Social (suppléments)
    "médical":                                  "Santé & Social",
    "paramédical":                              "Santé & Social",
    "esthétique":                               "Santé & Social",

    # Droit & Sécurité (suppléments)
    "activité judiciaire":                      "Droit & Sécurité",
    "droit (généralités)":                      "Droit & Sécurité",
    "droit privé":                              "Droit & Sécurité",
    "sécurité, prévention":                     "Droit & Sécurité",

    # Agriculture & Agroalimentaire (suppléments)
    "cultures":                                 "Agriculture & Agroalimentaire",
    "développement agricole":                   "Agriculture & Agroalimentaire",
    "élevage, aquaculture":                     "Agriculture & Agroalimentaire",
    "forêt":                                    "Agriculture & Agroalimentaire",
    "machinisme agricole":                      "Agriculture & Agroalimentaire",

    # Communication & Médias (suppléments)
    "bibliothèque, documentation":              "Communication & Médias",
    "communication":                            "Communication & Médias",
    "industries graphiques":                    "Communication & Médias",
    "journalisme, édition, publicité":          "Communication & Médias",
    "lettres, linguistique":                    "Communication & Médias",

    # Finance & Assurance (suppléments)
    "assurances":                               "Finance & Assurance",
    "banque":                                   "Finance & Assurance",
    "comptabilité":                             "Finance & Assurance",
    "finances":                                 "Finance & Assurance",

    # Enseignement & Formation (suppléments)
    "enseignement":                             "Enseignement & Formation",
}

# ── Utilitaires ────────────────────────────────────────────────────────────

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


def map_sous_domaine(libelle: str) -> str | None:
    """Mappe un sous_domaine_web vers un macro-domaine Mirai."""
    return SOUS_DOMAINE_MAPPING.get(libelle.lower().strip())


# ── Parsing formations ─────────────────────────────────────────────────────

def parse_formations(xml_path: Path) -> tuple[list[dict], list[tuple[str, str]]]:
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
    unmapped_domaines: set[str] = set()

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

        # ── Champs texte (CDATA HTML) ──
        desc_court_raw = get_text(elem, "descriptif_format_court")
        acces_raw = get_text(elem, "descriptif_acces")
        description_courte = strip_html(desc_court_raw)
        acces = strip_html(acces_raw)

        # Filtre qualité : au moins un des deux champs doit être renseigné
        if not description_courte and not acces:
            skipped_content += 1
            continue

        # ── Type de formation ──
        type_elem = elem.find("type_Formation")
        type_sigle = get_text(type_elem, "type_formation_sigle") if type_elem is not None else None
        type_libelle_court = get_text(type_elem, "type_formation_libelle_court") if type_elem is not None else None
        type_libelle = get_text(type_elem, "type_formation_libelle") if type_elem is not None else None

        # ── Niveau certification ──
        niveau_cert = get_text(elem, "niveau_certification")

        # ── Poursuites d'études ──
        poursuites = []
        for pe in elem.findall(".//formation_poursuite_Etudes"):
            pe_id = pe.get("id")
            pe_libelle = pe.text.strip() if pe.text else None
            if pe_id and pe_libelle:
                poursuites.append({"id": pe_id, "libelle": pe_libelle})

        # ── Sous-domaines → macro-domaines ──
        sous_domaines_raw = []
        for sd in elem.findall(".//sous_domaine_web"):
            sd_id = get_text(sd, "id")
            sd_libelle = get_text(sd, "libelle")
            if sd_libelle:
                sous_domaines_raw.append((sd_id, sd_libelle))
                if not map_sous_domaine(sd_libelle):
                    unmapped_domaines.add(sd_libelle)

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
            "niveau_certification": niveau_cert,
            "description_courte": description_courte,
            "acces": acces,
            "attendus": strip_html(get_text(elem, "attendus")),
            "poursuite_etudes": poursuites or None,
            "url": get_text(elem, "url"),
            "sous_domaines": sous_domaines_raw,  # [(id, libelle), ...]
        })

    log.info(
        f"  Formations retenues : {len(formations)} "
        f"(ignorées niveau : {skipped_niveau}, ignorées contenu : {skipped_content})"
    )
    if unmapped_domaines:
        log.warning(f"  Sous-domaines non mappés ({len(unmapped_domaines)}) : {sorted(unmapped_domaines)}")

    return formations, formation_metier_pairs


# ── Parsing métiers ────────────────────────────────────────────────────────

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
        synonymes = []
        for syn in elem.findall(".//synonymes/synonyme"):
            nom = get_text(syn, "nom_metier")
            if nom:
                synonymes.append(nom)

        # ── Secteurs d'activité ──
        secteurs = []
        for sa in elem.findall(".//secteur_activite"):
            sa_id = get_text(sa, "id")
            sa_libelle = get_text(sa, "libelle")
            if sa_id and sa_libelle:
                secteurs.append({"id": sa_id, "libelle": sa_libelle})

        # ── Centres d'intérêt ──
        centres = []
        for ci in elem.findall(".//centre_interet"):
            ci_id = get_text(ci, "id")
            ci_libelle = get_text(ci, "libelle")
            if ci_id and ci_libelle:
                centres.append({"id": ci_id, "libelle": ci_libelle})

        # ── Niveau accès min ──
        niveau_elem = elem.find("niveau_acces_min")
        niveau_acces_min = get_text(niveau_elem, "libelle") if niveau_elem is not None else None

        # ── Salaire (dans vie_professionnelle) ──
        salaire = None
        vp_raw = get_text(elem, "vie_professionnelle")
        if vp_raw:
            vp_text = strip_html(vp_raw)
            # Extrait "A partir de X euros brut par mois"
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


# ── Ingestion en base ──────────────────────────────────────────────────────

def ingest():
    log.info("=== Démarrage de l'ingestion Onisep ===")

    # Crée les tables si elles n'existent pas
    Base.metadata.create_all(bind=engine)

    # ── 1. Parse les XML (en mémoire avant d'ouvrir la session) ──
    formations_data, fm_pairs = parse_formations(XML_FORMATIONS)
    metiers_data = parse_metiers(XML_METIERS)

    db = SessionLocal()
    try:
        # ── 2. Purge des données Onisep existantes ──
        log.info("Purge des données Onisep existantes...")
        db.execute(FormationMetier.delete())
        db.execute(FormationDomaine.delete())
        db.query(Formation).delete()
        db.query(Metier).delete()
        db.query(Domaine).delete()
        db.commit()

        # ── 3. Seed des macro-domaines Mirai ──
        log.info("Insertion des macro-domaines...")
        domaine_by_libelle: dict[str, Domaine] = {}
        for libelle, slug in MACRO_DOMAINES:
            d = Domaine(libelle=libelle, slug=slug)
            db.add(d)
            domaine_by_libelle[libelle] = d
        db.flush()  # récupère les IDs auto-incrémentés

        # ── 4. Insertion des formations ──
        log.info(f"Insertion de {len(formations_data)} formations...")
        formation_by_id: dict[str, Formation] = {}

        for fdata in formations_data:
            sous_domaines = fdata.pop("sous_domaines")

            f = Formation(**fdata)

            # Résolution des macro-domaines
            macro_libelles_vus: set[str] = set()
            for _, sd_libelle in sous_domaines:
                macro = map_sous_domaine(sd_libelle)
                if macro and macro not in macro_libelles_vus:
                    domaine_obj = domaine_by_libelle.get(macro)
                    if domaine_obj:
                        f.domaines.append(domaine_obj)
                        macro_libelles_vus.add(macro)

            db.add(f)
            formation_by_id[f.id] = f

        db.flush()

        # ── 5. Insertion des métiers ──
        log.info(f"Insertion de {len(metiers_data)} métiers...")
        metier_by_id: dict[str, Metier] = {}

        for mdata in metiers_data:
            m = Metier(**mdata)
            db.add(m)
            metier_by_id[m.id] = m

        db.flush()

        # ── 6. Liens formation ↔ métier ──
        log.info(f"Création des liens formation↔métier ({len(fm_pairs)} paires brutes)...")
        seen_pairs: set[tuple[str, str]] = set()
        nb_liens = 0
        for formation_id, metier_id in fm_pairs:
            pair = (formation_id, metier_id)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            formation = formation_by_id.get(formation_id)
            metier = metier_by_id.get(metier_id)
            if formation and metier:
                formation.metiers.append(metier)
                nb_liens += 1

        db.commit()
        log.info(f"  Liens créés : {nb_liens}")
        log.info("=== Ingestion terminée avec succès ===")

    except Exception as e:
        db.rollback()
        log.error(f"Erreur lors de l'ingestion : {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    ingest()
