import { FORMATIONS_DATA } from "./formationsData";
import { METIERS_DATA } from "./metiersData";

export const formationToMetiers = Object.fromEntries(FORMATIONS_DATA.map((formation) => [formation.id, formation.metierIds || []]));

export const metierToFormations = Object.fromEntries(
  METIERS_DATA.map((metier) => [metier.id, metier.accesFormationsIds || []]),
);
