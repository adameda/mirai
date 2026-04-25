// Couche service — Exploration (domaines, formations, métiers)
// Appels API :
//   getAllDomaines()         → GET /domaines
//   getFormationsByDomaine() → GET /formations?domaine_id=...
//   getFormationById()       → GET /formations/:id
//   getMetiersByDomaine()    → GET /metiers?domaine_id=...
//   getMetierById()          → GET /metiers/:id
//   getSuggestedDomaines()   → filtre client sur getAllDomaines()

import { api } from './api';

export async function getAllDomaines() {
  return api.get('/domaines');
}

export async function getFormationsByDomaine(domaineId) {
  return api.get(`/formations?domaine_id=${domaineId}`);
}

export async function getFormationById(id) {
  return api.get(`/formations/${id}`);
}

export async function getMetiersByDomaine(domaineId) {
  return api.get(`/metiers?domaine_id=${domaineId}`);
}

export async function getMetierById(id) {
  return api.get(`/metiers/${id}`);
}

// Retourne les domaines suggérés selon les domaines d'intérêt de l'onboarding.
// Fallback sur les 3 premiers domaines si aucune correspondance.
export async function getSuggestedDomaines(answeredDomaines) {
  const all = await getAllDomaines();
  const labels = (answeredDomaines || []).map(d => d.toLowerCase());
  const matched = all.filter(d =>
    labels.some(l => d.libelle.toLowerCase().includes(l) || l.includes(d.libelle.toLowerCase()))
  );
  return matched.length ? matched.slice(0, 3) : all.slice(0, 3);
}
