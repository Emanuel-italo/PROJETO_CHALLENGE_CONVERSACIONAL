import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  content: {
    paddingBottom: 120,
  },

  topHeader: {
    height: 10,
  },

  banner: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    padding: 18,
    backgroundColor: Colors.accentLight + "15",
    borderWidth: 1,
    borderColor: Colors.accentLight + "30",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  bannerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.accentLight + "20",
    alignItems: "center",
    justifyContent: "center",
  },

  bannerText: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  chatButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    marginLeft: 14,
    backgroundColor: Colors.accentLight,
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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },

  card: {
    width: "48%",
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  iconBlue: {
    backgroundColor: Colors.accentLight + "20",
  },

  iconGreen: {
    backgroundColor: Colors.accentGreen + "20",
  },

  iconOrange: {
    backgroundColor: Colors.accentOrange + "20",
  },

  iconRed: {
    backgroundColor: Colors.accentRed + "20",
  },

  cardValue: {
    fontSize: 26,
    fontWeight: "800",
  },

  blueText: {
    color: Colors.accentLight,
  },

  greenText: {
    color: Colors.accentGreen,
  },

  orangeText: {
    color: Colors.accentOrange,
  },

  redText: {
    color: Colors.accentRed,
  },

  cardLabel: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: "600",
  },
});
