import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { light, dark } from "../theme/colors";

const STORAGE_KEY = "theme-mode";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme(); // the device's setting, used as the first-run default
  const [mode, setMode] = useState(system === "dark" ? "dark" : "light");

  // load the saved choice, if there is one
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") setMode(saved);
      })
      .catch(() => {});
  }, []);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      colors: mode === "dark" ? dark : light,
      toggle,
    }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
