import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "42%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  value: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.text,
  },

  label: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
