// ThemeContext.tsx
//
// Provider do tema. Guarda o modo escolhido, persiste no AsyncStorage e o
// disponibiliza via useTheme() / useThemeControls() (em src/styles/theme.ts).

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { storageService } from "../services/StorageService";
import { ThemeContext, ThemeMode, buildTheme } from "../styles/theme";

const THEME_KEY = "@clyvo:theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [mode, setModeState] = useState<ThemeMode>(
    systemScheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    (async () => {
      try {
        const saved = await storageService.getData(THEME_KEY);
        if (saved === "light" || saved === "dark") {
          setModeState(saved);
        }
      } catch {
        // Sem preferência salva: mantém o padrão do SO.
      }
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storageService.saveData(THEME_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      storageService.saveData(THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme: buildTheme(mode === "dark"), mode, toggle, setMode }),
    [mode, toggle, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}