export const parcoursMockEleve = (s, cfg) => {
  if (!s.onboarded) return { titre: "Compléter le profil", detail: "Profil à compléter" };
  if (s.domaines < cfg.obj2.target) {
    return { titre: "Sauvegarder des domaines", detail: `${s.domaines} / ${cfg.obj2.target} en favoris` };
  }
  if (s.formations < cfg.obj3.target) {
    return { titre: "Sauvegarder des formations", detail: `${s.formations} / ${cfg.obj3.target} en favoris` };
  }
  if (s.metiers < cfg.obj4.target) {
    return { titre: "Sauvegarder des métiers", detail: `${s.metiers} / ${cfg.obj4.target} en favoris` };
  }
  return { titre: "Parcours à jour", detail: "Objectifs remplis" };
};
