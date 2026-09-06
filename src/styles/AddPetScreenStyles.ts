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

  content: {
    padding: 20,
    paddingBottom: 60,
  },

  avatarArea: {
    alignItems: "center",
    marginBottom: 28,
    gap: 10,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,

    backgroundColor: Colors.accentLight + "20",

    alignItems: "center",
    justifyContent: "center",
  },

  avatarHint: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },

  label: {
    fontSize: 13,
    color: Colors.textLight,

    marginBottom: 8,
    marginTop: 16,
  },

  errorText: {
    fontSize: 12,
    color: Colors.accentRed,
    marginTop: 6,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: Colors.textLight,
    fontSize: 14,
  },

  input: {
    backgroundColor: Colors.secondary,

    borderRadius: 12,

    padding: 14,

    color: Colors.white,
    fontSize: 15,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.08)",
  },

  inputError: {
    borderColor: Colors.accentRed,
  },

  row: {
    flexDirection: "row",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,

    borderRadius: 20,

    backgroundColor: Colors.secondary,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.1)",
  },

  chipSelected: {
    backgroundColor: Colors.accentLight,

    borderColor: Colors.accentLight,
  },

  chipText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: "600",
  },

  chipTextSelected: {
    color: Colors.white,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,

    backgroundColor: Colors.accentLight,

    borderRadius: 14,

    paddingVertical: 16,

    marginTop: 32,
  },

  saveBtnDisabled: {
    opacity: 0.5,
  },

  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
