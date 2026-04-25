import { api } from './api';

export async function signup(nom, prenom, email, password, role, inviteCode, classCode) {
  const body = { nom, prenom, email, password, role, invite_code: inviteCode };
  if (classCode) body.class_code = classCode;
  return api.post('/auth/signup', body);
}

export async function login(email, password) {
  return api.post('/auth/login', { email, password });
}

export async function getMe() {
  return api.get('/me');
}

export async function postOnboarding(answers) {
  return api.post('/me/onboarding', {
    niveau:            answers.niveau?.[0]  || null,
    matieres:          answers.matieres     || [],
    style:             answers.style        || [],
    duree:             answers.duree?.[0]   || null,
    domaines_interets: answers.domaines     || [],
  });
}
