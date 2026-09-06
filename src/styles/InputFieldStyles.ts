import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    marginBottom: 4,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  labelLight: {
    color: Colors.textSecondary,
  },

  labelDark: {
    color: "rgba(255,255,255,0.8)",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    gap: 10,
  },

  inputBoxLight: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },

  inputBoxDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
  },

  inputBoxError: {
    borderColor: Colors.accentRed,
  },

  input: {
    flex: 1,
    fontSize: 15,
  },

  inputTextLight: {
    color: Colors.text,
  },

  inputTextDark: {
    color: Colors.white,
  },

  iconLeft: {
    justifyContent: "center",
    alignItems: "center",
  },

  iconRight: {
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },

  errorText: {
    fontSize: 12,
    color: Colors.accentRed,
    marginTop: 2,
  },
});
