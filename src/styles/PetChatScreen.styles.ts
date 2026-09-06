// PetChatScreenStyles.ts

import { StyleSheet, Dimensions } from "react-native";

import { Colors } from "./colors";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    backgroundColor: Colors.primary,

    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  backBtn: {
    width: 40,
    height: 40,

    borderRadius: 12,

    backgroundColor: "rgba(255,255,255,0.1)",

    justifyContent: "center",

    alignItems: "center",
  },

  headerInfo: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",

    color: Colors.white,
  },

  headerSub: {
    fontSize: 12,

    color: "rgba(255,255,255,0.5)",

    marginTop: 1,
  },

  avatar: {
    width: 40,
    height: 40,

    borderRadius: 12,

    backgroundColor: "rgba(255,255,255,0.15)",

    justifyContent: "center",

    alignItems: "center",
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 30,
  },

  welcome: {
    alignItems: "center",

    marginTop: 80,

    gap: 12,
  },

  welcomeTitle: {
    color: Colors.white,

    fontSize: 22,

    fontWeight: "700",
  },

  welcomeText: {
    color: Colors.textSecondary,

    fontSize: 14,

    textAlign: "center",
  },

  msgRow: {
    marginBottom: 14,
  },

  msgRowUser: {
    alignItems: "flex-end",
  },

  msgRowAi: {
    alignItems: "flex-start",
  },

  msgBubbleUser: {
    backgroundColor: Colors.primary,

    borderRadius: 18,

    borderBottomRightRadius: 5,

    paddingHorizontal: 16,
    paddingVertical: 11,

    maxWidth: width * 0.75,
  },

  msgBubbleAi: {
    backgroundColor: Colors.card,

    borderRadius: 18,

    borderBottomLeftRadius: 5,

    paddingHorizontal: 16,
    paddingVertical: 11,

    maxWidth: width * 0.78,

    shadowColor: "#000",

    shadowOpacity: 0.05,

    shadowRadius: 6,

    elevation: 1,
  },

  msgTextUser: {
    color: Colors.white,

    fontSize: 14,

    lineHeight: 20,
  },

  msgTextAi: {
    color: Colors.text,

    fontSize: 14,

    lineHeight: 22,
  },

  typingBubble: {
    backgroundColor: Colors.card,

    borderRadius: 18,

    borderBottomLeftRadius: 5,

    paddingHorizontal: 18,
    paddingVertical: 14,

    flexDirection: "row",

    alignItems: "center",

    alignSelf: "flex-start",

    marginBottom: 14,
  },

  inputBar: {
    flexDirection: "row",

    alignItems: "flex-end",

    gap: 10,

    paddingHorizontal: 16,
    paddingVertical: 12,

    backgroundColor: Colors.card,

    borderTopWidth: 1,

    borderTopColor: Colors.background,
  },

  inputWrap: {
    flex: 1,

    backgroundColor: Colors.background,

    borderRadius: 22,

    paddingHorizontal: 16,
    paddingVertical: 10,

    maxHeight: 100,
  },

  input: {
    fontSize: 14,

    color: Colors.text,

    lineHeight: 20,
  },

  sendBtn: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: Colors.primary,

    justifyContent: "center",

    alignItems: "center",

    shadowColor: Colors.primary,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.3,

    shadowRadius: 8,

    elevation: 4,
  },

  sendBtnDisabled: {
    backgroundColor: Colors.background,

    shadowOpacity: 0,

    elevation: 0,
  },
});
