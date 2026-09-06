import { StyleSheet, Dimensions } from "react-native";

import { Colors } from "./colors";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    paddingBottom: 40,
  },

  orb: {
    position: "absolute",

    top: -120,
    right: -80,

    width: 240,
    height: 240,

    borderRadius: 120,

    backgroundColor: Colors.primary + "20",
  },

  orbBottom: {
    position: "absolute",

    bottom: -100,
    left: -80,

    width: 220,
    height: 220,

    borderRadius: 110,

    backgroundColor: Colors.primary + "12",
  },

  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  back: {
    width: 44,
    height: 44,

    borderRadius: 14,

    backgroundColor: Colors.card,

    justifyContent: "center",

    alignItems: "center",
  },

  logoRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  logo: {
    fontSize: 14,

    fontWeight: "800",

    color: Colors.accentLight,

    letterSpacing: 1,
  },

  headerSpacer: {
    width: 44,
  },

  badgeRow: {
    alignItems: "center",

    marginTop: 12,
  },

  badge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 999,

    backgroundColor: Colors.card,
  },

  badgeDot: {
    width: 8,
    height: 8,

    borderRadius: 999,

    backgroundColor: "#007BFF",
  },

  badgeText: {
    color: Colors.textSecondary,

    fontSize: 11,

    fontWeight: "700",

    letterSpacing: 1,
  },

  title: {
    marginTop: 26,

    textAlign: "center",

    color: "#007BFF",

    fontSize: 34,

    fontWeight: "800",

    lineHeight: 40,
  },

  sub: {
    marginTop: 14,

    textAlign: "center",

    color: Colors.textSecondary,

    fontSize: 15,

    lineHeight: 24,

    paddingHorizontal: 30,
  },

  stepIndicator: {
    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 34,

    marginBottom: 26,

    paddingHorizontal: 20,
  },

  stepItem: {
    flexDirection: "row",

    alignItems: "center",
  },

  stepDot: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: Colors.card,

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 1.5,

    borderColor: "rgba(255,255,255,0.08)",
  },

  stepDotActive: {
    backgroundColor: "#007BFF",
  },

  stepDotDone: {
    backgroundColor: "#007BFF",
  },

  stepLabel: {
    marginLeft: 8,

    color: Colors.textSecondary,

    fontSize: 12,

    fontWeight: "600",
  },

  stepLabelActive: {
    color: "#007BFF",
  },

  stepLine: {
    width: 40,
    height: 2,

    backgroundColor: "rgba(255,255,255,0.1)",

    marginHorizontal: 10,
  },

  stepLineDone: {
    backgroundColor: "#007BFF",
  },

  formCard: {
    marginHorizontal: 20,

    padding: 22,

    borderRadius: 28,

    backgroundColor: Colors.card,
  },

  sectionTitle: {
    color: "#007BFF",

    fontSize: 18,

    fontWeight: "800",

    marginBottom: 20,
  },

  dividerField: {
    height: 14,
  },

  passwordHint: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,

    marginTop: 16,
  },

  passwordHintText: {
    color: Colors.textSecondary,

    fontSize: 12,

    flex: 1,
  },

  actions: {
    marginTop: 28,

    paddingHorizontal: 20,
  },

  btnPrimary: {
    height: 58,

    borderRadius: 20,

    backgroundColor: Colors.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  btnPrimaryText: {
    color: "#007BFF",

    fontSize: 16,

    fontWeight: "800",
  },

  btnArrow: {
    position: "absolute",

    right: 18,

    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: "rgba(255,255,255,0.12)",

    justifyContent: "center",

    alignItems: "center",
  },

  dividerRow: {
    flexDirection: "row",

    alignItems: "center",

    marginVertical: 24,
  },

  divider: {
    flex: 1,

    height: 1,

    backgroundColor: "rgba(255,255,255,0.08)",
  },

  dividerText: {
    marginHorizontal: 14,

    color: Colors.textSecondary,

    fontSize: 12,

    fontWeight: "600",
  },

  btnSecondary: {
    height: 56,

    borderRadius: 18,

    borderWidth: 1.5,

    borderColor: "#007BFF",

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: Colors.card,
  },

  btnSecondaryText: {
    color: "#007BFF",

    fontSize: 15,

    fontWeight: "700",
  },

  legalRow: {
    marginTop: 22,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 6,
  },

  legalText: {
    color: Colors.textSecondary,

    fontSize: 11,
  },
});
