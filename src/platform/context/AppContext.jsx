import { createContext, useCallback, useMemo, useState, useEffect } from "react";
import { DEFAULT_CONFIG } from "../data/defaultConfig";
import { api } from "../services/api";
import * as authService from "../services/authService";

const AppContext = createContext(null);

function getInitialState() {
  return {
    screen: "landing",
    authMode: "signup",
    user: null,
    answers: {},
    onboarded: false,
    page: "dashboard",
    savedItems: [],
    config: DEFAULT_CONFIG,
  };
}

// API FavorisGroupedOut → tableau interne { id, type, refId, label, parent, parentRefId }
function normalizeFavoris(grouped) {
  return [
    ...(grouped.domaines  || []),
    ...(grouped.formations || []),
    ...(grouped.metiers   || []),
  ].map(f => ({
    id:         f.id,
    type:       f.type,
    refId:      f.ref_id,
    label:      f.libelle,
    parent:     f.parent_libelle || null,
    parentRefId: null,
  }));
}

// API ClasseConfigOut → config interne { obj1, obj2, obj3, obj4 }
function normalizeConfig(cfg) {
  return {
    obj1: {},
    obj2: { target: cfg.target_domaines  ?? 3, date: cfg.date_domaines  ?? null },
    obj3: { target: cfg.target_formations ?? 5, date: cfg.date_formations ?? null },
    obj4: { target: cfg.target_metiers   ?? 4, date: cfg.date_metiers   ?? null },
  };
}

// Config interne → corps PATCH /classe/config
function denormalizeConfig(config) {
  return {
    target_domaines:   config.obj2.target,
    date_domaines:     config.obj2.date  || null,
    target_formations: config.obj3.target,
    date_formations:   config.obj3.date  || null,
    target_metiers:    config.obj4.target,
    date_metiers:      config.obj4.date  || null,
  };
}

export function AppProvider({ children }) {
  const initial = getInitialState();

  const [screen,     setScreen]     = useState(initial.screen);
  const [authMode,   setAuthMode]   = useState(initial.authMode);
  const [user,       setUser]       = useState(initial.user);
  const [answers,    setAnswers]    = useState(initial.answers);
  const [onboarded,  setOnboarded]  = useState(initial.onboarded);
  const [page,       setPage]       = useState(initial.page);
  const [savedItems, setSavedItems] = useState(initial.savedItems);
  const [config,     setConfig]     = useState(initial.config);
  const [loading,    setLoading]    = useState(true);   // true le temps de restaurer la session
  const [authError,  setAuthError]  = useState(null);
  const [chatContext, setChatContext] = useState(null); // { type, refId, label } | null

  // ── Restauration de session au montage ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('mirai_token');
    if (!token) {
      setLoading(false);
      return;
    }
    async function restore() {
      try {
        const me = await authService.getMe();
        setUser({ nom: me.nom, prenom: me.prenom, email: me.email, role: me.role, classCode: me.class_code });
        setOnboarded(me.onboarded);

        // Réponses onboarding stockées localement
        try {
          const stored = localStorage.getItem('mirai_answers');
          if (stored) setAnswers(JSON.parse(stored));
        } catch (_) {}

        if (me.role === 'eleve' && me.onboarded) {
          const favoris = await api.get('/favoris');
          setSavedItems(normalizeFavoris(favoris));
        }

        if (me.class_code || me.role === 'prof') {
          try {
            const cfg = await api.get('/classe/config');
            setConfig(normalizeConfig(cfg));
          } catch (_) {}
        }

        setScreen('app');
        setPage(me.role === 'prof' ? 'prof-dashboard' : 'dashboard');
      } catch (_) {
        // Token invalide ou expiré
        localStorage.removeItem('mirai_token');
        localStorage.removeItem('mirai_answers');
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────
  const completeAuth = useCallback(async ({ nom, prenom, email, password, role, inviteCode, classCode, isSignup }) => {
    setAuthError(null);
    const result = isSignup
      ? await authService.signup(nom, prenom, email, password, role, inviteCode, classCode)
      : await authService.login(email, password);

    localStorage.setItem('mirai_token', result.access_token);
    const me = result.user;
    setUser({ nom: me.nom, prenom: me.prenom, email: me.email, role: me.role, classCode: me.class_code });
    setOnboarded(me.onboarded);

    if (me.role === 'eleve') {
      if (me.class_code) {
        try {
          const cfg = await api.get('/classe/config');
          setConfig(normalizeConfig(cfg));
        } catch (_) {}
      }
      if (me.onboarded) {
        const favoris = await api.get('/favoris');
        setSavedItems(normalizeFavoris(favoris));
        setScreen('app');
        setPage('dashboard');
      } else {
        setScreen('onboarding');
      }
    } else {
      try {
        const cfg = await api.get('/classe/config');
        setConfig(normalizeConfig(cfg));
      } catch (_) {}
      setScreen('app');
      setPage('prof-dashboard');
    }
  }, []);

  // ── Onboarding ─────────────────────────────────────────────────────────
  const startOnboarding = useCallback(() => {
    setScreen('onboarding');
  }, []);

  const completeOnboarding = useCallback(async (newAnswers) => {
    try {
      await authService.postOnboarding(newAnswers);
    } catch (e) {
      console.error('Onboarding API error:', e);
    }
    localStorage.setItem('mirai_answers', JSON.stringify(newAnswers));
    setAnswers(newAnswers);
    setOnboarded(true);
    setScreen('app');
    setPage('dashboard');
  }, []);

  // ── Favoris ────────────────────────────────────────────────────────────
  const saveItem = useCallback(async (type, _label, parent, refId, parentRefId) => {
    const refStr = String(refId);
    if (savedItems.some(i => i.type === type && i.refId === refStr)) return;
    try {
      const result = await api.post('/favoris', { type, ref_id: refStr });
      setSavedItems(prev => [...prev, {
        id:         result.id,
        type:       result.type,
        refId:      result.ref_id,
        label:      result.libelle,
        parent:     result.parent_libelle || parent || null,
        parentRefId: parentRefId || null,
      }]);
    } catch (e) {
      console.error('Erreur ajout favori:', e);
    }
  }, [savedItems]);

  const removeItem = useCallback(async (type, identifier) => {
    const item = savedItems.find(
      i => i.type === type && (i.refId === identifier || i.label === identifier)
    );
    if (!item) return;
    try {
      await api.delete(`/favoris/${item.id}`);
      setSavedItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      console.error('Erreur suppression favori:', e);
    }
  }, [savedItems]);

  // ── Config classe (prof) ───────────────────────────────────────────────
  const saveConfig = useCallback(async (newConfig) => {
    try {
      await api.patch('/classe/config', denormalizeConfig(newConfig));
      setConfig(newConfig);
    } catch (e) {
      console.error('Erreur sauvegarde config:', e);
      throw e;
    }
  }, []);

  // ── Chat ──────────────────────────────────────────────────────────────
  const openChat = useCallback((item) => {
    setChatContext({ type: item.type, refId: item.refId || item.id, label: item.label || item.nom || item.libelle_complet });
    setPage("chatbot");
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('mirai_token');
    localStorage.removeItem('mirai_answers');
    const reset = getInitialState();
    setScreen(reset.screen);
    setAuthMode(reset.authMode);
    setUser(reset.user);
    setAnswers(reset.answers);
    setOnboarded(reset.onboarded);
    setPage(reset.page);
    setSavedItems(reset.savedItems);
    setConfig(reset.config);
    setAuthError(null);
  }, []);

  const isProf = user?.role === 'prof';
  const locked = !onboarded;

  const value = useMemo(() => ({
    screen, setScreen,
    authMode, setAuthMode,
    user,
    answers,
    onboarded,
    page, setPage,
    savedItems,
    config, setConfig,
    loading,
    authError, setAuthError,
    isProf,
    locked,
    saveItem,
    removeItem,
    saveConfig,
    completeAuth,
    startOnboarding,
    completeOnboarding,
    logout,
    chatContext, setChatContext,
    openChat,
  }), [
    screen, authMode, user, answers, onboarded, page, savedItems, config,
    loading, authError, isProf, locked,
    saveItem, removeItem, saveConfig, completeAuth, startOnboarding, completeOnboarding, logout,
    chatContext, openChat,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
