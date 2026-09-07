// theme.ts
//
// Paletas clara e escura + tema orientado a contexto.
//
// `useTheme()` continua com a MESMA assinatura de antes, então nenhuma tela
// precisa ser alterada. A diferença é a FONTE do tema:
//   - com <ThemeProvider> na árvore, o tema vem do contexto (toggle manual);
//   - sem ele, cai no esquema do sistema operacional (comportamento antigo).

import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

export const LightColors = {
  primary: "#0A1628",
  secondary: "#1E3A5F",
  accent: "#1A6EBD",
  accentLight: "#4A9EFF",
  accentGreen: "#2ECC71",
  accentOrange: "#F39C12",
  accentRed: "#E74C3C",
  white: "#FFFFFF",
  black: "#000000",
  background: "#F0F4F8",
  card: "#FFFFFF",
  text: "#0A1628",
  textSecondary: "#4A5568",
  textLight: "#A0AEC0",
  border: "#E2E8F0",
};

// Escuro suavizado. Se preferir o escuro anterior, troque background/card/border
// pelos valores antigos (#070D18 / #111B2C / #22304A).
export const DarkColors: typeof LightColors = {
  primary: "#0A1628",
  secondary: "#1E3A5F",
  accent: "#2C82D6",
  accentLight: "#5AA9FF",
  accentGreen: "#35D07F",
  accentOrange: "#F5A623",
  accentRed: "#FF6B5E",
  white: "#FFFFFF",
  black: "#000000",
  background: "#0C1424",
  card: "#16223A",
  text: "#E8EEF6",
  textSecondary: "#93A3B8",
  textLight: "#61748C",
  border: "#263651",
};

export type ThemeColors = typeof LightColors;

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  overlay: (opacity: number) => string;
  tint: (opacity: number) => string;
};

export function buildTheme(isDark: boolean): Theme {
  return {
    colors: isDark ? DarkColors : LightColors,
    isDark,
    overlay: (opacity: number) =>
      isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
    tint: (opacity: number) =>
      isDark ? `rgba(90,169,255,${opacity})` : `rgba(74,158,255,${opacity})`,
  };
}

export type ThemeMode = "light" | "dark";

export type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  const scheme = useColorScheme(); // sempre chamado (regras dos hooks)

  return ctx ? ctx.theme : buildTheme(scheme === "dark");
}

export function useThemeControls(): ThemeContextValue {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error(
      "useThemeControls precisa de <ThemeProvider> acima na árvore de componentes.",
    );
  }

  return ctx;
}