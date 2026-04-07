import { createContext, useCallback, useMemo, useState } from "react";
import { DEFAULT_CONFIG } from "../data/defaultConfig";

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

export function AppProvider({ children }) {
  const initialState = getInitialState();

  const [screen, setScreen] = useState(initialState.screen);
  const [authMode, setAuthMode] = useState(initialState.authMode);
  const [user, setUser] = useState(initialState.user);
  const [answers, setAnswers] = useState(initialState.answers);
  const [onboarded, setOnboarded] = useState(initialState.onboarded);
  const [page, setPage] = useState(initialState.page);
  const [savedItems, setSavedItems] = useState(initialState.savedItems);
  const [config, setConfig] = useState(initialState.config);

  const saveItem = useCallback((type, label, parent, refId = label, parentRefId = null) => {
    setSavedItems((prev) => {
      if (prev.some((item) => item.type === type && (refId ? item.refId === refId : item.label === label))) {
        return prev;
      }
      return [...prev, { id: Date.now(), type, refId, label, parent, parentRefId }];
    });
  }, []);

  const removeItem = useCallback((type, identifier) => {
    setSavedItems((prev) => prev.filter((item) => !(item.type === type && (item.refId === identifier || item.label === identifier))));
  }, []);

  const completeAuth = useCallback(({ prenom, role, classCode }) => {
    setUser({ prenom, role, classCode });
    if (role === "prof") {
      setPage("prof-dashboard");
      setScreen("app");
      return;
    }
    setPage("dashboard");
    setScreen("app");
  }, []);

  const startOnboarding = useCallback(() => {
    setScreen("onboarding");
  }, []);

  const completeOnboarding = useCallback((newAnswers) => {
    setAnswers(newAnswers);
    setOnboarded(true);
    setScreen("app");
    setPage("dashboard");
  }, []);

  const logout = useCallback(() => {
    const reset = getInitialState();
    setScreen(reset.screen);
    setAuthMode(reset.authMode);
    setUser(reset.user);
    setAnswers(reset.answers);
    setOnboarded(reset.onboarded);
    setPage(reset.page);
    setSavedItems(reset.savedItems);
    setConfig(reset.config);
  }, []);

  const isProf = user?.role === "prof";
  const locked = !onboarded;

  const value = useMemo(
    () => ({
      screen,
      setScreen,
      authMode,
      setAuthMode,
      user,
      answers,
      onboarded,
      page,
      setPage,
      savedItems,
      config,
      setConfig,
      isProf,
      locked,
      saveItem,
      removeItem,
      completeAuth,
      startOnboarding,
      completeOnboarding,
      logout,
    }),
    [screen, authMode, user, answers, onboarded, page, savedItems, config, isProf, locked, saveItem, removeItem, completeAuth, startOnboarding, completeOnboarding, logout],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
