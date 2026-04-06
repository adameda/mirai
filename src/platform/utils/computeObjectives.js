export const computeObjectives = (onboarded, savedItems, config) => {
  const today = new Date().toISOString().split("T")[0];
  const counts = {
    domaine: savedItems.filter((i) => i.type === "domaine").length,
    formation: savedItems.filter((i) => i.type === "formation").length,
    metier: savedItems.filter((i) => i.type === "metier").length,
  };

  const objs = [
    {
      id: 1,
      title: "Compléter mon profil",
      desc: "À faire dès l'inscription pour débloquer la plateforme.",
      value: onboarded ? 1 : 0,
      target: 1,
      date: null,
    },
    {
      id: 2,
      title: "Sauvegarder des domaines",
      desc: `Enregistre ${config.obj2.target} domaines dans tes favoris depuis l'exploration.`,
      value: Math.min(counts.domaine, config.obj2.target),
      target: config.obj2.target,
      date: config.obj2.date ?? null,
    },
    {
      id: 3,
      title: "Sauvegarder des formations",
      desc: `Enregistre ${config.obj3.target} formations dans tes favoris.`,
      value: Math.min(counts.formation, config.obj3.target),
      target: config.obj3.target,
      date: config.obj3.date ?? null,
    },
    {
      id: 4,
      title: "Sauvegarder des métiers",
      desc: `Enregistre ${config.obj4.target} métiers dans tes favoris.`,
      value: Math.min(counts.metier, config.obj4.target),
      target: config.obj4.target,
      date: config.obj4.date ?? null,
    },
  ];

  const firstPendingIdx = objs.findIndex((obj) => obj.value < obj.target);
  const activeIdx = firstPendingIdx === -1 ? objs.length - 1 : firstPendingIdx;

  const computedObjs = objs.map((obj, index) => {
    const achieved = obj.value >= obj.target;
    const overdue = Boolean(obj.date) && today > obj.date && !achieved;
    const lateDone = Boolean(obj.date) && today > obj.date && achieved;
    const locked = index > activeIdx && !achieved;
    const current = index === activeIdx && !achieved;

    return {
      ...obj,
      achieved,
      overdue,
      lateDone,
      locked,
      current,
      status: achieved ? (lateDone ? "done-late" : "done") : overdue ? "overdue" : current ? "current" : "locked",
      progressLabel: `${obj.value}/${obj.target}`,
    };
  });

  return { objs: computedObjs, activeIdx, today };
};
