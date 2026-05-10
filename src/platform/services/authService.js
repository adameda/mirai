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
    niveau:              answers.niveau?.[0]              || null,
    voie:                answers.voie?.[0]                || null,
    filiere:             answers.filiere?.[0]             || null,
    specialites:         answers.specialites              || [],
    matieres_fortes:     answers.matieres_fortes          || [],
    matieres_aimees:     answers.matieres_aimees          || [],
    centres_interet:     answers.centres_interet          || [],
    style:               answers.style                    || [],
    duree:               answers.duree?.[0]               || null,
    domaines_interets:   answers.domaines_interets        || [],
    pression_academique: answers.pression_academique?.[0] || null,
  });
}
