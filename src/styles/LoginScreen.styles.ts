import { StyleSheet, Dimensions } from "react-native";

import { Colors } from "./colors";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },

  orb: {
    position: "absolute",

    width: width * 0.75,
    height: width * 0.75,

    borderRadius: width * 0.375,

    backgroundColor: Colors.secondary,

    top: -width * 0.28,
    right: -width * 0.22,

    opacity: 0.5,
  },

  orbBottom: {
    position: "absolute",

    width: width * 0.45,
    height: width * 0.45,

    borderRadius: width * 0.225,

    backgroundColor: Colors.accentLight,

    bottom: -width * 0.15,
    left: -width * 0.15,

    opacity: 0.06,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 36,
    paddingTop: 8,
  },

  back: {
    width: 44,
    height: 44,

    borderRadius: 14,

    backgroundColor: "rgba(255,255,255,0.1)",

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.1)",
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  logo: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },

  headerSpacer: {
    width: 44,
  },

  badgeRow: {
    marginBottom: 14,
  },

  badge: {
    alignSelf: "flex-start",

    backgroundColor: "rgba(255,255,255,0.08)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.14)",

    paddingHorizontal: 14,
    paddingVertical: 6,

    borderRadius: 20,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  badgeDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: Colors.accentLight,
  },

  badgeText: {
    color: Colors.accentLight,

    fontSize: 11,

    fontWeight: "700",

    letterSpacing: 1.5,
  },

  title: {
    fontSize: Math.min(width * 0.1, 40),

    fontWeight: "800",

    color: Colors.white,

    lineHeight: Math.min(width * 0.125, 50),

    marginBottom: 10,

    letterSpacing: -0.5,
  },

  sub: {
    fontSize: 15,

    color: "rgba(255,255,255,0.45)",

    marginBottom: 32,

    lineHeight: 22,
  },

  formCard: {
    backgroundColor: "rgba(255,255,255,0.05)",

    borderRadius: 24,

    padding: 22,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.09)",

    marginBottom: 20,

    gap: 6,
  },

  dividerField: {
    height: 1,

    backgroundColor: "rgba(255,255,255,0.07)",

    marginVertical: 4,
  },

  forgotRow: {
    flexDirection: "row",

    justifyContent: "flex-end",

    marginTop: 6,
  },

  forgotBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  forgotText: {
    color: Colors.accentLight,

    fontSize: 13,

    fontWeight: "600",
  },

  actions: {
    gap: 12,
  },

  btnPrimary: {
    backgroundColor: Colors.accentLight,

    paddingVertical: Math.min(height * 0.022, 18),

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 10,

    shadowColor: Colors.accentLight,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.35,

    shadowRadius: 16,

    elevation: 8,
  },

  btnPrimaryText: {
    color: Colors.primary,

    fontSize: 16,

    fontWeight: "800",

    letterSpacing: 0.2,
  },

  btnArrow: {
    width: 28,
    height: 28,

    borderRadius: 8,

    backgroundColor: "rgba(255,255,255,0.25)",

    justifyContent: "center",

    alignItems: "center",
  },

  dividerRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 12,

    marginVertical: 2,
  },

  divider: {
    flex: 1,

    height: 1,

    backgroundColor: "rgba(255,255,255,0.08)",
  },

  dividerText: {
    color: "rgba(255,255,255,0.25)",

    fontSize: 13,

    fontWeight: "500",
  },

  btnSecondary: {
    paddingVertical: Math.min(height * 0.02, 16),

    borderRadius: 16,

    alignItems: "center",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.15)",

    backgroundColor: "rgba(255,255,255,0.04)",
  },

  btnSecondaryText: {
    color: "rgba(255,255,255,0.7)",

    fontSize: 15,

    fontWeight: "600",
  },

  trustRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 16,

    marginTop: 8,
  },

  trustItem: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  trustText: {
    color: "rgba(255,255,255,0.3)",

    fontSize: 11,

    fontWeight: "500",
  },
});
