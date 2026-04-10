// Couche service — Exploration (domaines, formations, métiers)
//
// Toutes les fonctions wrappent les mocks actuels.
// À l'étape 7, chaque fonction sera remplacée par un appel fetch vers le back.
// Correspondances avec API_CONTRACT.md :
//   getAllDomaines()              → GET /domaines
//   getFormationsByDomaine()     → GET /formations?domaine_id=...
//   getFormationById()           → GET /formations/:id
//   getFormationByLabel()        → (supprimé côté API — les IDs seront toujours disponibles)
//   getMetierById()              → GET /metiers/:id
//   getMetierByLabel()           → (supprimé côté API)
//   getMetiersForFormation()     → GET /metiers?formation_id=...
//   getFormationsForMetier()     → via GET /metiers/:id (champ formations_min_requises)
//   getSuggestedDomaines()       → GET /domaines?suggest=true

import {
  ALL_DOMAINES,
  FORMATIONS_DATA,
  getFormationById as _getFormationById,
  getFormationsByDomaine as _getFormationsByDomaine,
} from "../data/formationsData";
import { METIERS_DATA, getMetierById as _getMetierById } from "../data/metiersData";
import { formationToMetiers, metierToFormations } from "../data/relationsData";

export function getAllDomaines() {
  return ALL_DOMAINES;
}

export function getFormationsByDomaine(domaine) {
  return _getFormationsByDomaine(domaine);
}

export function getFormationById(id) {
  return _getFormationById(id);
}

export function getFormationByLabel(label) {
  return FORMATIONS_DATA.find((f) => f.label === label) || null;
}

export function getMetierById(id) {
  return _getMetierById(id);
}

export function getMetierByLabel(label) {
  return METIERS_DATA.find((m) => m.label === label) || null;
}

export function getMetiersForFormation(formationId) {
  return (formationToMetiers[formationId] || []).map(_getMetierById).filter(Boolean);
}

export function getFormationsForMetier(metierId) {
  return (metierToFormations[metierId] || []).map(_getFormationById).filter(Boolean);
}

// Retourne les domaines suggérés selon les réponses d'onboarding de l'élève.
// Fallback sur les 3 premiers domaines si aucune correspondance trouvée.
export function getSuggestedDomaines(answeredDomaines) {
  const suggested = (answeredDomaines || [])
    .filter((d) => d !== "Pas encore d'idee" && _getFormationsByDomaine(d).length > 0)
    .slice(0, 3);
  return suggested.length ? suggested : ALL_DOMAINES.slice(0, 3);
}
