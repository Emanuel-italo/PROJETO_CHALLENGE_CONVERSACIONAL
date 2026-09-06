import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  content: {
    padding: 16,
    paddingBottom: 140,
  },

  profileCard: {
    backgroundColor: Colors.secondary,

    borderRadius: 22,

    padding: 24,

    alignItems: "center",

    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,

    borderRadius: 45,

    backgroundColor: Colors.accentLight + "25",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 14,
  },

  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.accentLight,
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.white,
  },

  email: {
    fontSize: 14,
    marginTop: 4,
    color: Colors.textLight,
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    marginTop: 18,

    paddingHorizontal: 18,
    paddingVertical: 12,

    borderRadius: 14,

    backgroundColor: Colors.accentLight,
  },

  editBtnText: {
    color: Colors.white,
    fontWeight: "700",
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",

    color: "rgba(255,255,255,0.45)",

    marginBottom: 12,

    textTransform: "uppercase",
  },

  faqItem: {
    backgroundColor: Colors.secondary,

    borderRadius: 16,

    padding: 16,

    marginBottom: 10,
  },

  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  faqQ: {
    flex: 1,

    fontSize: 14,
    fontWeight: "600",

    color: Colors.white,

    marginRight: 10,
  },

  faqA: {
    marginTop: 12,

    fontSize: 13,

    lineHeight: 20,

    color: Colors.textLight,
  },

  logoutBtn: {
    height: 58,

    borderRadius: 16,

    backgroundColor: "rgba(255,107,107,0.12)",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,

    marginBottom: 40,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B6B",
  },

  modalOverlay: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalBox: {
    backgroundColor: Colors.secondary,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    padding: 24,
    paddingBottom: 40,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",

    color: Colors.white,

    marginBottom: 18,
  },

  input: {
    height: 54,

    borderRadius: 14,

    paddingHorizontal: 16,

    marginBottom: 14,

    color: Colors.white,

    backgroundColor: Colors.primary,
  },

  modalBtns: {
    flexDirection: "row",
    gap: 12,

    marginTop: 8,
  },

  cancelBtn: {
    flex: 1,

    height: 52,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.primary,
  },

  saveBtn: {
    flex: 1,

    height: 52,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.accentLight,
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
