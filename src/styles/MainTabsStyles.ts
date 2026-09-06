import { StyleSheet } from "react-native";

import { Colors } from "./colors";

export const styles = StyleSheet.create({
  header: {
    paddingBottom: 22,
    paddingHorizontal: 20,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: Colors.primary,
  },

  centerArea: {
    flex: 1,
    alignItems: "center",
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  logo: {
    fontSize: 34,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 1,
  },

  greeting: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 4,
  },

  date: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    textTransform: "capitalize",
  },

  screenTitle: {
    flex: 1,
    textAlign: "center",

    fontSize: 24,
    fontWeight: "800",

    color: Colors.white,
  },

  menuButton: {
    width: 52,
    height: 52,

    borderRadius: 18,

    backgroundColor: "rgba(255,255,255,0.08)",

    alignItems: "center",
    justifyContent: "center",
  },

  rightSpacer: {
    width: 52,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",

    justifyContent: "flex-start",
    alignItems: "flex-start",

    paddingTop: 110,
    paddingLeft: 20,
  },

  menuContainer: {
    width: 220,

    borderRadius: 22,

    backgroundColor: "#17315B",

    paddingVertical: 10,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  menuText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },

  tabBarStyle: {
    position: "absolute",

    left: 18,
    right: 18,
    bottom: 18,

    height: 82,

    borderRadius: 28,

    backgroundColor: "#17315B",

    borderTopWidth: 0,

    paddingTop: 10,
    paddingBottom: 10,

    elevation: 0,
  },

  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  tabIcon: {
    width: 46,
    height: 46,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",
  },

  activeTabIcon: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
