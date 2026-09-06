import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    flex: 1,
    gap: 3,
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});
