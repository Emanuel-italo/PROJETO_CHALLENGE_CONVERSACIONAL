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

  addBtn: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: Colors.accentGreen + "30",

    alignItems: "center",

    justifyContent: "center",
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

  vacName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  vacSub: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },

  vacDate: {
    fontSize: 12,

    color: "rgba(255,255,255,0.4)",

    marginTop: 1,
  },

  actions: {
    flexDirection: "row",
    gap: 4,
  },

  actionBtn: {
    padding: 6,
  },

  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },

  emptyText: {
    color: Colors.textLight,

    fontSize: 15,

    fontWeight: "600",
  },

  emptyBtn: {
    marginTop: 4,

    paddingHorizontal: 24,

    paddingVertical: 12,

    backgroundColor: Colors.accentGreen,

    borderRadius: 12,
  },

  emptyBtnText: {
    color: Colors.white,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.6)",

    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: Colors.secondary,

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    padding: 24,

    paddingBottom: 40,
  },

  modalTitle: {
    fontSize: 18,

    fontWeight: "700",

    color: Colors.white,

    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 12,

    color: Colors.textLight,

    marginBottom: 6,

    marginTop: 4,
  },

  input: {
    backgroundColor: Colors.primary,

    borderRadius: 12,

    padding: 14,

    color: Colors.white,

    fontSize: 15,

    marginBottom: 4,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.08)",
  },

  petRow: {
    flexDirection: "row",
    gap: 8,
  },

  petChip: {
    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 20,

    backgroundColor: Colors.primary,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.1)",
  },

  petChipSelected: {
    backgroundColor: Colors.accentGreen,

    borderColor: Colors.accentGreen,
  },

  petChipText: {
    color: Colors.textLight,

    fontWeight: "600",

    fontSize: 13,
  },

  modalBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  cancelBtn: {
    flex: 1,

    padding: 14,

    borderRadius: 12,

    backgroundColor: Colors.primary,

    alignItems: "center",
  },

  saveBtn: {
    flex: 1,

    padding: 14,

    borderRadius: 12,

    backgroundColor: Colors.accentGreen,

    alignItems: "center",
  },

  cancelText: {
    color: Colors.textLight,
    fontWeight: "600",
  },

  saveText: {
    color: Colors.white,
    fontWeight: "700",
  },
});
