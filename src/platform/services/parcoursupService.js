import { api } from './api';

export function getFiltres() {
  return api.get('/parcoursup/filtres');
}

export function getSpecialitesForAgregee(filiereAgregee) {
  return api.get(`/parcoursup/specialites?filiere_agregee=${encodeURIComponent(filiereAgregee)}`);
}

export function searchFormations({ q, filiere_agregee, filiere_type, region, selectivite, sort_by, limit = 40, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q)               params.set('q', q);
  if (filiere_agregee) params.set('filiere_agregee', filiere_agregee);
  if (filiere_type)    params.set('filiere_type', filiere_type);
  if (region)          params.set('region', region);
  if (selectivite)     params.set('selectivite', selectivite);
  if (sort_by)         params.set('sort_by', sort_by);
  params.set('limit',  limit);
  params.set('offset', offset);
  return api.get(`/parcoursup?${params}`);
}
