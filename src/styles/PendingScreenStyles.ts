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

    backgroundColor: "rgba(255,255,255,0.08)",

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",

    color: Colors.white,
  },

  headerSpacer: {
    width: 36,
  },

  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,

    backgroundColor: Colors.secondary,

    borderRadius: 14,
    padding: 14,
  },

  iconBox: {
    width: 42,
    height: 42,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",
  },

  info: {
    flex: 1,
  },

  itemName: {
    fontSize: 15,
    fontWeight: "600",

    color: Colors.white,
  },

  itemSub: {
    fontSize: 12,

    color: Colors.textLight,

    marginTop: 2,
  },

  itemDate: {
    fontSize: 12,

    color: Colors.accentRed + "cc",

    marginTop: 2,
  },

  resolveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 10,

    backgroundColor: Colors.accentRed + "20",
  },

  resolveBtnText: {
    color: Colors.accentRed,

    fontSize: 12,
    fontWeight: "700",
  },

  empty: {
    alignItems: "center",

    paddingTop: 100,

    gap: 12,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",

    color: Colors.white,
  },

  emptyText: {
    color: Colors.textLight,

    fontSize: 14,
  },

  emptyBtn: {
    marginTop: 8,

    paddingHorizontal: 24,
    paddingVertical: 12,

    backgroundColor: Colors.accentGreen,

    borderRadius: 12,
  },

  emptyBtnText: {
    color: Colors.white,

    fontWeight: "700",
  },
});
