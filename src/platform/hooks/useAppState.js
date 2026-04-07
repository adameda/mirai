import { useContext } from "react";
import AppContext from "../context/AppContext";

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState doit etre utilise dans AppProvider");
  }
  return context;
}

export function useFavorites() {
  const { savedItems, saveItem, removeItem } = useAppState();
  return { savedItems, saveItem, removeItem };
}

export function useAppSession() {
  const { screen, authMode, user, onboarded, page, isProf, locked } = useAppState();
  return { screen, authMode, user, onboarded, page, isProf, locked };
}
