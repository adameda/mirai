export const FORMATIONS_DATA = [
  {
    id: "FOR.6779",
    domaine: "Commerce international",
    label: "BTS commerce international",
    sigle: "CI",
    typeFormation: {
      sigle: "BTS",
      libelleCourt: "BTS",
      libelle: "brevet de technicien supérieur",
    },
    duree: "2 ans",
    selectivite: "Accessible",
    niveauEtudes: "bac + 2",
    descriptionCourte:
      "Le BTS commerce international forme au développement du commerce international, à la coordination des opérations export/import et à la communication interculturelle.",
    acces:
      "Accessible avec un bac général, technologique ou professionnel. Accès sur dossier, parfois tests et/ou entretien.",
    pourSujets: ["Commerce", "International", "Langues"],
    metierIds: ["MET.8083", "MET.545", "MET.453"],
  },
  {
    id: "FOR.271",
    domaine: "Logistique et transport",
    label: "BTS gestion des transports et logistique associée",
    sigle: "GTLA",
    typeFormation: {
      sigle: "BTS",
      libelleCourt: "BTS",
      libelle: "brevet de technicien supérieur",
    },
    duree: "2 ans",
    selectivite: "Accessible",
    niveauEtudes: "bac + 2",
    descriptionCourte:
      "Le BTS gestion des transports et logistique associée prépare à organiser, piloter et optimiser les flux de marchandises sur des chaînes de transport complexes.",
    acces: "Accessible après un bac général, technologique ou professionnel, sur dossier.",
    pourSujets: ["Logistique", "Transport", "Organisation"],
    metierIds: ["MET.398", "MET.545"],
  },
  {
    id: "FOR.7909",
    domaine: "Logistique et transport",
    label: "BUT management de la logistique et des transports parcours mobilité et supply chain connectées",
    sigle: "MLT",
    typeFormation: {
      sigle: "BUT",
      libelleCourt: "BUT",
      libelle: "bachelor universitaire de technologie",
    },
    duree: "3 ans",
    selectivite: "Sélectif",
    niveauEtudes: "bac + 3",
    descriptionCourte:
      "Le BUT MLT forme à la gestion des flux, à la supply chain et aux outils numériques de pilotage des opérations logistiques.",
    acces: "Accessible après le bac, sur dossier et parfois entretien.",
    pourSujets: ["Supply chain", "Mobilité", "Transport"],
    metierIds: ["MET.398", "MET.8083"],
  },
  {
    id: "FOR.10972",
    domaine: "Logistique et transport",
    label: "licence pro mention logistique et transports internationaux",
    sigle: "LP LTI",
    typeFormation: {
      sigle: "Licence pro",
      libelleCourt: "Licence pro",
      libelle: "licence professionnelle",
    },
    duree: "1 an",
    selectivite: "Accessible",
    niveauEtudes: "bac + 3",
    descriptionCourte:
      "La licence pro logistique et transports internationaux approfondit les dimensions opérationnelles, réglementaires et internationales de la chaîne logistique.",
    acces: "Accessible après un bac + 2 selon le dossier de candidature.",
    pourSujets: ["Logistique", "International", "Opérations"],
    metierIds: ["MET.398", "MET.453"],
  },
];

export const ALL_DOMAINES = [...new Set(FORMATIONS_DATA.map((formation) => formation.domaine))];

export const getFormationById = (formationId) => FORMATIONS_DATA.find((formation) => formation.id === formationId) || null;

export const getFormationsByDomaine = (domaine) => FORMATIONS_DATA.filter((formation) => formation.domaine === domaine);
