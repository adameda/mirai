// Service auth — signup, login, profil, onboarding
// Correspondances API :
//   signup()        → POST /auth/signup
//   login()         → POST /auth/login
//   getMe()         → GET  /me
//   postOnboarding()→ POST /me/onboarding

import { api } from './api';

export async function signup(prenom, role, classCode) {
  const body = { prenom, role };
  if (classCode) body.class_code = classCode;
  return api.post('/auth/signup', body);
}

export async function login(prenom, role, classCode) {
  const body = { prenom, role };
  if (classCode) body.class_code = classCode;
  return api.post('/auth/login', body);
}

export async function getMe() {
  return api.get('/me');
}

export async function postOnboarding(answers) {
  // answers = { niveau: ["Terminale"], matieres: [...], style: [...], duree: [...], domaines: [...] }
  return api.post('/me/onboarding', {
    niveau:           answers.niveau?.[0]  || null,
    matieres:         answers.matieres     || [],
    style:            answers.style        || [],
    duree:            answers.duree?.[0]   || null,
    domaines_interets: answers.domaines    || [],
  });
}
