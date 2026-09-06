import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },

  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.accent + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    flex: 1,
    gap: 3,
  },

  name: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
  },

  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  tags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },

  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  healthLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: "600",
    width: 38,
  },

  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 3,
  },

  healthPct: {
    fontSize: 12,
    fontWeight: "700",
    width: 36,
    textAlign: "right",
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
