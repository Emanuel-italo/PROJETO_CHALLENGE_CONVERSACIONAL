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
    paddingBottom: 18,
    backgroundColor: Colors.secondary,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  centerHeader: {
    alignItems: "center",
    justifyContent: "center",
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  logoIcon: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: Colors.white + "10",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  title: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  menuContainer: {
    width: 240,
    backgroundColor: Colors.secondary,
    marginTop: 110,
    marginLeft: 18,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  menuText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  list: {
    padding: 18,
    paddingBottom: 120,
    gap: 14,
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 90,
  },

  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.white,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    color: Colors.textLight,
  },

  emptyBtn: {
    marginTop: 26,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Colors.accentLight,
  },

  emptyBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },

  card: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.accentLight + "18",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  petName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },

  petMeta: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.textLight,
  },

  tags: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  tagText: {
    fontSize: 11,
    color: Colors.textLight,
  },

  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  healthLabel: {
    width: 52,
    fontSize: 12,
    color: Colors.textLight,
  },

  barBg: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  barFill: {
    height: "100%",
    borderRadius: 999,
  },

  healthPct: {
    width: 45,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statText: {
    fontSize: 11,
    color: Colors.textLight,
  },
});
