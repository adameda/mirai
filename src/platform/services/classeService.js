// Couche service — Classe (côté professeur)
//
// Wrappent les mocks actuels.
// À l'étape 7, remplacé par des appels fetch vers le back.
// Correspondances avec API_CONTRACT.md :
//   getClasseStudents()   → GET /classes/me (champ eleves)

import { MOCK_STUDENTS } from "../data/mockStudents";

export function getClasseStudents() {
  return MOCK_STUDENTS;
}
