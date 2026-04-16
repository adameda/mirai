// Couche service — Classe (côté professeur)
// Étape 7 : appels réels vers le back
// Correspondances API :
//   getClasseStudents()  → GET /classe      (champ eleves)
//   getClasseStats()     → GET /classe/stats

import { api } from './api';

export async function getClasseStudents() {
  const classe = await api.get('/classe');
  // On normalise les champs pour rester compatibles avec le front existant
  return (classe.eleves || []).map(e => ({
    id:         e.id,
    prenom:     e.prenom,
    onboarded:  e.onboarded,
    domaines:   e.nb_domaines,
    formations: e.nb_formations,
    metiers:    e.nb_metiers,
  }));
}

export async function getClasseStats() {
  return api.get('/classe/stats');
}
