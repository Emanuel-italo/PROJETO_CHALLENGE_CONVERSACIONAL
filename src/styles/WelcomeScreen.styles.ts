import { StyleSheet, Dimensions } from "react-native";

import { Colors } from "./colors";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  container: {
    flex: 1,

    backgroundColor: Colors.primary,

    paddingHorizontal: 24,

    paddingTop: height * 0.06,

    paddingBottom: height * 0.04,

    justifyContent: "space-between",

    overflow: "hidden",
  },

  orb1: {
    position: "absolute",

    width: width * 0.85,
    height: width * 0.85,

    borderRadius: width * 0.425,

    backgroundColor: Colors.secondary,

    top: -width * 0.35,
    right: -width * 0.25,

    opacity: 0.55,
  },

  orb2: {
    position: "absolute",

    width: width * 0.5,
    height: width * 0.5,

    borderRadius: width * 0.25,

    backgroundColor: Colors.accentLight,

    bottom: height * 0.18,

    left: -width * 0.2,

    opacity: 0.08,
  },

  orb3: {
    position: "absolute",

    width: width * 0.3,
    height: width * 0.3,

    borderRadius: width * 0.15,

    backgroundColor: Colors.accent,

    bottom: -width * 0.1,
    right: -width * 0.05,

    opacity: 0.12,
  },

  content: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    gap: 20,
  },

  logoWrap: {
    alignItems: "center",

    marginBottom: 4,
  },

  logoRing: {
    width: 88,
    height: 88,

    borderRadius: 26,

    backgroundColor: "rgba(255,255,255,0.08)",

    borderWidth: 1.5,

    borderColor: "rgba(255,255,255,0.18)",

    justifyContent: "center",

    alignItems: "center",
  },

  logoBox: {
    width: 64,
    height: 64,

    borderRadius: 18,

    backgroundColor: Colors.accentLight,

    justifyContent: "center",

    alignItems: "center",

    shadowColor: Colors.accentLight,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.45,

    shadowRadius: 16,

    elevation: 12,
  },

  brand: {
    fontSize: Math.min(width * 0.13, 52),

    fontWeight: "900",

    color: Colors.white,

    letterSpacing: 4,

    textAlign: "center",

    marginBottom: 6,
  },

  brandAccent: {
    color: Colors.accentLight,

    fontWeight: "300",
  },

  tagline: {
    fontSize: Math.min(width * 0.056, 22),

    fontWeight: "600",

    color: "rgba(255,255,255,0.75)",

    textAlign: "center",

    lineHeight: Math.min(width * 0.082, 33),
  },

  taglineHL: {
    color: Colors.white,

    fontWeight: "800",
  },

  pillsRow: {
    flexDirection: "row",

    gap: 8,

    flexWrap: "wrap",

    justifyContent: "center",

    marginTop: 4,

    paddingHorizontal: 8,
  },

  pill: {
    backgroundColor: "rgba(255,255,255,0.07)",

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 24,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.12)",
  },

  pillText: {
    color: "rgba(255,255,255,0.7)",

    fontSize: 12,

    fontWeight: "500",

    letterSpacing: 0.3,
  },

  actions: {
    gap: 10,

    paddingTop: 8,
  },

  btnPrimary: {
    backgroundColor: Colors.accentLight,

    paddingVertical: Math.min(height * 0.022, 17),

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 10,

    shadowColor: Colors.accentLight,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.35,

    shadowRadius: 12,

    elevation: 8,
  },

  btnPrimaryText: {
    color: Colors.primary,

    fontSize: 16,

    fontWeight: "800",

    letterSpacing: 0.3,
  },

  btnArrow: {
    width: 28,
    height: 28,

    borderRadius: 8,

    backgroundColor: "rgba(255,255,255,0.25)",

    justifyContent: "center",

    alignItems: "center",
  },

  btnSecondary: {
    paddingVertical: Math.min(height * 0.02, 15),

    borderRadius: 16,

    alignItems: "center",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.18)",

    backgroundColor: "rgba(255,255,255,0.05)",
  },

  btnSecondaryText: {
    color: "rgba(255,255,255,0.75)",

    fontSize: 15,

    fontWeight: "600",
  },

  legal: {
    textAlign: "center",

    fontSize: 11,

    color: "rgba(255,255,255,0.3)",

    marginTop: 2,
  },
});
