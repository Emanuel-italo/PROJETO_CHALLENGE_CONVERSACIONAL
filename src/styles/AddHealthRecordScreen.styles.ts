import { StyleSheet } from "react-native";

import { Colors } from "./colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: Colors.primary,
  },

  header: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 20,

    paddingBottom: 16,

    backgroundColor: Colors.secondary,
  },

  back: {
    width: 36,
    height: 36,

    borderRadius: 18,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.08)",
  },

  title: {
    fontSize: 18,

    fontWeight: "700",

    color: Colors.white,
  },

  headerSpacer: {
    width: 36,
  },

  content: {
    padding: 20,

    paddingBottom: 60,
  },

  label: {
    fontSize: 13,

    color: Colors.textLight,

    marginBottom: 12,

    letterSpacing: 0.4,
  },

  petLabel: {
    marginTop: 28,
  },

  typeRow: {
    flexDirection: "row",

    gap: 12,
  },

  typeCard: {
    flex: 1,

    backgroundColor: Colors.secondary,

    borderRadius: 14,

    padding: 16,

    borderWidth: 1.5,

    borderColor: "rgba(255,255,255,0.08)",

    gap: 8,
  },

  typeIcon: {
    width: 44,
    height: 44,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  typeLabel: {
    fontSize: 15,

    fontWeight: "700",

    color: Colors.white,
  },

  typeDesc: {
    fontSize: 12,

    color: Colors.textLight,

    lineHeight: 16,
  },

  petList: {
    gap: 10,
  },

  petRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 12,

    backgroundColor: Colors.secondary,

    borderRadius: 12,

    padding: 14,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.08)",
  },

  petAvatar: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: Colors.accentLight + "20",

    alignItems: "center",

    justifyContent: "center",
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 15,

    fontWeight: "600",

    color: Colors.white,
  },

  petMeta: {
    fontSize: 12,

    color: Colors.textLight,

    marginTop: 2,
  },

  emptyPets: {
    alignItems: "center",

    paddingVertical: 32,

    gap: 10,
  },

  emptyText: {
    color: Colors.textLight,

    fontSize: 14,
  },

  linkText: {
    color: Colors.accentLight,

    fontSize: 14,

    fontWeight: "600",
  },
});
