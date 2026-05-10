// ── Matières par profil ───────────────────────────────────────────────────────

export const MATIERES_PAR_PROFIL = {
  seconde: [
    "Maths", "Physique-Chimie", "SVT", "SES",
    "Histoire-Géo", "Français", "Langues vivantes", "SNT (Numérique)", "EPS", "Arts",
  ],
  generale: [
    "Maths", "Physique-Chimie", "SVT", "NSI",
    "SES", "HGGSP", "Humanités-Littérature-Philo (HLP)",
    "LLCER (Langues vivantes)", "LLCA (Langues anciennes)",
    "Sciences de l'Ingénieur", "Arts", "EPS",
  ],
  STI2D: [
    "Maths", "Physique-Chimie", "Sciences de l'Ingénieur",
    "Innovation Technologique", "Histoire-Géo", "Français", "Langues vivantes",
  ],
  STMG: [
    "Maths", "Économie", "Droit", "Management",
    "Sciences de Gestion & Numérique", "Histoire-Géo", "Français", "Langues vivantes",
  ],
  ST2S: [
    "Maths", "Sciences Sanitaires et Sociales",
    "Biologie et Physiopathologie Humaines", "Physique-Chimie pour la Santé",
    "Histoire-Géo", "Français", "Langues vivantes",
  ],
  STL_Biotechnologies: [
    "Maths", "Physique-Chimie", "Biochimie-Biologie",
    "Biotechnologies", "Histoire-Géo", "Français", "Langues vivantes",
  ],
  STL_SPCL: [
    "Maths", "Physique-Chimie", "Sciences Physiques et Chimiques en Labo (SPCL)",
    "Histoire-Géo", "Français", "Langues vivantes",
  ],
  STD2A: [
    "Design et Métiers d'Art", "Analyse et Méthodes en Design",
    "Maths", "Physique-Chimie", "Outils Numériques",
    "Histoire-Géo", "Français", "Langues vivantes",
  ],
  STHR: [
    "Sciences Culinaires et des Services", "Économie et Gestion Hôtelière",
    "Sciences Alimentation-Environnement", "Maths",
    "Histoire-Géo", "Français", "Langues vivantes",
  ],
};

export function getMatieres(niveau, voie, filiere) {
  if (niveau === "Seconde") return MATIERES_PAR_PROFIL.seconde;
  if (voie === "Technologique") {
    if (filiere === "STL_Biotechnologies") return MATIERES_PAR_PROFIL.STL_Biotechnologies;
    if (filiere === "STL_SPCL")           return MATIERES_PAR_PROFIL.STL_SPCL;
    return MATIERES_PAR_PROFIL[filiere]  || MATIERES_PAR_PROFIL.seconde;
  }
  return MATIERES_PAR_PROFIL.generale;
}

// ── Spécialités voie générale ─────────────────────────────────────────────────

export const SPECIALITES_GENERALE = [
  "Maths",
  "Physique-Chimie",
  "SVT",
  "NSI (Numérique & Sciences Informatiques)",
  "SES (Sciences Économiques et Sociales)",
  "HGGSP (Histoire-Géo-Géopolitique)",
  "Humanités-Littérature-Philo (HLP)",
  "LLCER (Langues vivantes étrangères)",
  "LLCA (Langues et cultures de l'Antiquité)",
  "Sciences de l'Ingénieur",
  "Arts",
  "EPS",
];

// ── Filières technologiques ───────────────────────────────────────────────────

export const FILIERES_TECHNO = [
  { id: "STI2D",               label: "STI2D",              sub: "Industrie & Développement Durable" },
  { id: "STMG",                label: "STMG",               sub: "Management & Gestion" },
  { id: "ST2S",                label: "ST2S",               sub: "Santé & Social" },
  { id: "STL_Biotechnologies", label: "STL – Biotechnologies", sub: "Sciences de Laboratoire" },
  { id: "STL_SPCL",            label: "STL – SPCL",         sub: "Sciences Physiques en Labo" },
  { id: "STD2A",               label: "STD2A",              sub: "Design & Arts Appliqués" },
  { id: "STHR",                label: "STHR",               sub: "Hôtellerie & Restauration" },
];

// ── Centres d'intérêt ─────────────────────────────────────────────────────────

export const CENTRES_INTERET = [
  "Coder, bidouiller, construire des trucs numériques",
  "Créer : dessiner, filmer, composer, écrire, concevoir",
  "Analyser des données, des chiffres, trouver des patterns",
  "Comprendre comment le corps humain ou la nature fonctionnent",
  "Aider quelqu'un à résoudre un problème concret",
  "Organiser, planifier, piloter un projet de A à Z",
  "Convaincre, négocier, pitcher une idée",
  "Construire ou réparer quelque chose de mes mains",
  "Expérimenter, tester des hypothèses en labo ou sur le terrain",
  "Apprendre des langues, découvrir d'autres cultures",
  "Défendre une cause, agir pour quelque chose qui compte",
  "Soigner, accompagner, soutenir quelqu'un",
];

// ── Style / environnement de travail ─────────────────────────────────────────

export const STYLES_TRAVAIL = [
  "Dehors, en mouvement, sur le terrain — pas enfermé",
  "Face à des gens en permanence : clients, patients, élèves...",
  "Dans une équipe qui collabore sur des projets",
  "Concentré seul sur des sujets complexes et techniques",
  "En train de manager, décider, avoir des responsabilités",
  "À créer des choses qui existent ensuite dans le monde réel",
];

// ── Durée d'études ────────────────────────────────────────────────────────────

export const DUREES = [
  { label: "2-3 ans", sub: "je veux rentrer vite dans la vie active" },
  { label: "3-4 ans", sub: "un bon équilibre" },
  { label: "5 ans et plus", sub: "je vise loin" },
  { label: "Je ne sais pas encore", sub: "" },
];

// ── Rapport à la pression ─────────────────────────────────────────────────────

export const PRESSION_OPTIONS = [
  "Franchement à l'aise — j'aime les défis",
  "Ça se passe bien, je gère",
  "C'est variable selon les matières",
  "C'est dur, j'ai besoin de plus de soutien",
];
