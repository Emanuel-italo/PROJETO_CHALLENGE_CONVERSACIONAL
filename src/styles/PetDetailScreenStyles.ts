import { StyleSheet } from "react-native";

import { Colors } from "./colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: Colors.white,
  },

  headerActions: {
    flexDirection: "row",
    gap: 10,
  },

  editBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.accentLight + "20",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.accentRed + "20",
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },

  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: Colors.accentLight + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  petName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },

  petMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },

  ringNum: {
    fontSize: 18,
    fontWeight: "900",
  },

  ringLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  chips: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.background,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
  },

  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  statsRow: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  stat: {
    alignItems: "center",
    gap: 4,
  },

  statVal: {
    fontSize: 16,
    fontWeight: "900",
  },

  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  statDiv: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },

  tabsRow: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 13,
    padding: 4,
    gap: 4,
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },

  tabBtnActive: {
    backgroundColor: Colors.primary,
  },

  tabBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  tabBtnTextActive: {
    color: Colors.white,
  },

  infoBlock: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: "hidden",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  infoKey: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  infoVal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  noData: {
    textAlign: "center",
    color: Colors.textSecondary,
    paddingTop: 30,
  },
});
