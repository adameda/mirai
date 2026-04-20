// Couche service — Exploration (domaines, formations, métiers)
// Étape 7 : tous les appels frappent le back via api.js
// Correspondances API :
//   getAllDomaines()          → GET /domaines
//   getFormationsByDomaine()  → GET /formations?domaine_id=...
//   getFormationById()        → GET /formations/:id
//   getMetierById()           → GET /metiers/:id
//   getMetiersForFormation()  → GET /metiers?formation_id=...
//   getFormationsForMetier()  → via GET /metiers/:id (champ formations)
//   getSuggestedDomaines()    → filtre client sur getAllDomaines()

import { api } from './api';

export async function getAllDomaines() {
  return api.get('/domaines');
}

export async function getFormationsByDomaine(domaineId) {
  return api.get(`/formations?domaine_id=${domaineId}`);
}

export async function getAllFormations() {
  return api.get('/formations');
}

export async function getFormationById(id) {
  return api.get(`/formations/${id}`);
}

export async function getMetierById(id) {
  return api.get(`/metiers/${id}`);
}

export async function getMetiersForFormation(formationId) {
  return api.get(`/metiers?formation_id=${formationId}`);
}

export async function getMetiersByDomaine(domaineId) {
  return api.get(`/metiers?domaine_id=${domaineId}`);
}

export async function getAllMetiers() {
  return api.get('/metiers');
}

export async function getFormationsForMetier(metierId) {
  const metier = await api.get(`/metiers/${metierId}`);
  return metier.formations || [];
}

// Retourne les domaines suggérés selon les domaines d'intérêt de l'onboarding.
// answeredDomaines = tableau de labels libres saisis par l'élève.
// On les compare (insensible à la casse) aux libellés des domaines réels.
// Fallback sur les 3 premiers domaines si aucune correspondance.
export async function getSuggestedDomaines(answeredDomaines) {
  const all = await getAllDomaines();
  const labels = (answeredDomaines || []).map(d => d.toLowerCase());
  const matched = all.filter(d => labels.some(l => d.libelle.toLowerCase().includes(l) || l.includes(d.libelle.toLowerCase())));
  return matched.length ? matched.slice(0, 3) : all.slice(0, 3);
}
