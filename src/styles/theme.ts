// theme.ts
//
// Paletas clara e escura + hook de tema.
//
// A paleta clara é exatamente a de `colors.ts`, então nada muda visualmente no
// modo claro. A escura reaproveita os mesmos tokens, o que permite trocar
// `Colors.x` por `colors.x` em qualquer tela sem redesenhar nada.

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
  background: "#070D18",
  card: "#111B2C",
  text: "#E8EEF6",
  textSecondary: "#93A3B8",
  textLight: "#61748C",
  border: "#22304A",
};

export type ThemeColors = typeof LightColors;

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  /** Sobreposição sutil: divisórias, fundos de botão, bordas de card. */
  overlay: (opacity: number) => string;
  /** Tinta da cor de destaque, usada nos cards e ícones. */
  tint: (opacity: number) => string;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return {
    colors: isDark ? DarkColors : LightColors,
    isDark,
    overlay: (opacity: number) =>
      isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
    tint: (opacity: number) =>
      isDark ? `rgba(90,169,255,${opacity})` : `rgba(74,158,255,${opacity})`,
  };
}