export const FORMATIONS_DATA = {
  "Informatique & Tech": [
    { l: "BUT Informatique", d: "3 ans", n: "Accessible" },
    { l: "Licence Informatique", d: "3 ans", n: "Accessible" },
    { l: "BTS SIO", d: "2 ans", n: "Accessible" },
    { l: "Ecole d'ingenieur", d: "5 ans", n: "Selectif" },
    { l: "Classe prepa MPSI", d: "2+3 ans", n: "Tres selectif" },
  ],
  "Finance & Commerce": [
    { l: "BTS MCO", d: "2 ans", n: "Accessible" },
    { l: "Bachelor Commerce", d: "3 ans", n: "Accessible" },
    { l: "Ecole de commerce", d: "5 ans", n: "Selectif" },
  ],
  "Sante & Medecine": [
    { l: "PASS (Medecine)", d: "6 ans min", n: "Tres selectif" },
    { l: "BTS SP3S", d: "2 ans", n: "Accessible" },
    { l: "IFSI Infirmier", d: "3 ans", n: "Selectif" },
  ],
  "Droit & Justice": [
    { l: "Licence Droit", d: "3 ans", n: "Accessible" },
    { l: "Master Droit", d: "5 ans", n: "Selectif" },
    { l: "IEP Sciences Po", d: "5 ans", n: "Tres selectif" },
  ],
  "Art & Design": [
    { l: "BTS Design", d: "2 ans", n: "Accessible" },
    { l: "DNMADE", d: "3 ans", n: "Accessible" },
    { l: "Ecole d'art DNSEP", d: "5 ans", n: "Selectif" },
  ],
  Sciences: [
    { l: "Licence Sciences", d: "3 ans", n: "Accessible" },
    { l: "CPGE BCPST", d: "2+3 ans", n: "Tres selectif" },
  ],
  Communication: [
    { l: "BTS Communication", d: "2 ans", n: "Accessible" },
    { l: "Licence InfoCom", d: "3 ans", n: "Accessible" },
  ],
};

export const FORMATION_DESCS = {
  "BUT Informatique": "Formation universitaire technologique de 3 ans alliant programmation, réseaux et gestion de projets. Forte insertion professionnelle avec alternance possible.",
  "Licence Informatique": "Diplôme académique de 3 ans centré sur les fondements : algorithmique, langages, systèmes. Passerelle naturelle vers un Master ou une école par la suite.",
  "BTS SIO": "BTS de 2 ans orienté services informatiques aux organisations. Deux options : SLAM (développement) ou SISR (réseaux). Accessible et très professionnalisant.",
  "Ecole d'ingenieur": "Parcours de 5 ans (post-bac ou post-prépa) formant des ingénieurs polyvalents. Haut niveau d'exigence, réseau alumni puissant, débouchés excellents.",
  "Classe prepa MPSI": "Prépa scientifique de 2 ans préparant aux concours des grandes écoles. Rythme intense, culture générale élevée, excellence académique requise.",
  "BTS MCO": "BTS de 2 ans en management commercial opérationnel. Formation terrain axée vente, gestion relation client et management d'équipe commerciale.",
  "Bachelor Commerce": "Bachelor de 3 ans en école de commerce, accessible post-bac. Mélange cours théoriques, projets pratiques et stages en entreprise.",
  "Ecole de commerce": "Grande école de commerce (5 ans post-bac ou 3 ans post-prépa). Formation en management, finance et stratégie. Très sélectif, réseau international.",
  "PASS (Medecine)": "Parcours d'accès spécifique santé, première année sélective donnant accès aux études de médecine, pharmacie ou maïeutique selon les résultats.",
  "BTS SP3S": "BTS de 2 ans dans les services à la personne : animation sociale, coordination, accompagnement. Formation humaine à fort impact social.",
  "IFSI Infirmier": "Formation de 3 ans en Institut de Formation en Soins Infirmiers. Alterne enseignements cliniques et stages hospitaliers. Diplôme d'état reconnu.",
  "Licence Droit": "Licence de 3 ans à l'université, base solide pour tout juriste. Droit civil, pénal, public, constitutionnel. Ouvre vers Master droit ou IEP.",
  "Master Droit": "Master de 2 ans (bac+5) spécialisé selon les filières : affaires, pénal, public. Prérequis pour passer le barreau ou intégrer la magistrature.",
  "IEP Sciences Po": "Institut d'Études Politiques, 5 ans très sélectifs. Formation pluridisciplinaire en sciences humaines, politique, économie et langues.",
  "BTS Design": "BTS de 2 ans en design graphique ou produit. Atelier créatif, logiciels de création, projets clients. Sélection sur dossier et entretien.",
  DNMADE: "Diplôme national des métiers d'art et du design, 3 ans. Axé créativité appliquée : motion, espace, matière, graphisme selon la mention.",
  "Ecole d'art DNSEP": "5 ans dans une école nationale d'art supérieure. Diplôme bac+5 reconnu par l'État. Parcours très créatif et autonome, exigeant artistiquement.",
  "Licence Sciences": "Licence scientifique de 3 ans (physique, chimie, biologie…). Fondements solides, ouverture vers Master recherche ou grandes écoles scientifiques.",
  "CPGE BCPST": "Prépa biologie, chimie, physique, sciences de la Terre. 2 ans pour préparer les concours des écoles d'agronomie, vétérinaire et normaliens.",
  "BTS Communication": "BTS de 2 ans en communication. Stratégie de marque, création de contenus, événementiel, réseaux sociaux. Accès par dossier et entretien.",
  "Licence InfoCom": "Licence en information et communication, 3 ans. Journalisme, relations presse, communication digitale. Formation généraliste et ouverte.",
};

export const ALL_DOMAINES = Object.keys(FORMATIONS_DATA);
