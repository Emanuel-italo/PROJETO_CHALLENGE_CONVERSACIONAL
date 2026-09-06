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
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.secondary,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },

  headerSpace: {
    width: 40,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },

  calendarCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  monthText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

  weekTextWrapper: {
    width: "14.2857%",
    alignItems: "center",
  },

  weekText: {
    textAlign: "center",
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: "600",
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCellWrapper: {
    width: "14.2857%",
    aspectRatio: 1,
    padding: 2,
  },

  dayCell: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.accentLight,
  },

  dayCellSelected: {
    backgroundColor: Colors.accentLight,
  },

  dayNumber: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },

  dayNumberSelected: {
    color: Colors.primary,
    fontWeight: "800",
  },

  dotsRow: {
    flexDirection: "row",
    gap: 3,
    height: 6,
    alignItems: "center",
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  legendRing: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.accentLight,
  },

  legendText: {
    color: Colors.textLight,
    fontSize: 12,
  },

  dayDetailCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  dayDetailTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  pendingContainer: {
    gap: 12,
  },

  pendingTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },

  pendingCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  pendingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  pendingName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  pendingPet: {
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 2,
  },

  pendingDate: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },

  emptyText: {
    color: Colors.textLight,
    textAlign: "center",
  },

  flexOne: {
    flex: 1,
  },
});
