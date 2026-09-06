import { StyleSheet } from "react-native";

import { Colors } from "./colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  header: {
    paddingHorizontal: 20,
    marginBottom: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  addButton: {
    width: 52,
    height: 52,

    borderRadius: 18,

    backgroundColor: Colors.accentRed,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 14,
  },

  emptyContainer: {
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

  emptyButton: {
    marginTop: 26,

    paddingHorizontal: 28,
    paddingVertical: 14,

    borderRadius: 18,

    backgroundColor: Colors.accentRed,
  },

  emptyButtonText: {
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

  cardHeader: {
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

  cardInfo: {
    flex: 1,
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

  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 999,

    marginRight: 10,

    backgroundColor: Colors.accentRed + "20",
  },

  pendingText: {
    fontSize: 11,
    fontWeight: "700",

    color: Colors.accentRed,
  },

  healthContainer: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 18,
  },

  healthLabel: {
    width: 50,
    fontSize: 12,
    color: Colors.textLight,
  },

  progressBackground: {
    flex: 1,
    height: 7,

    borderRadius: 999,

    overflow: "hidden",

    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  healthValue: {
    width: 45,

    fontSize: 12,
    fontWeight: "700",

    textAlign: "right",
  },

  statsContainer: {
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

  checkupContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    marginTop: 18,

    paddingTop: 14,

    borderTopWidth: 1,

    borderTopColor: "rgba(255,255,255,0.06)",
  },

  checkupText: {
    fontSize: 12,
    color: Colors.textLight,
  },
});
