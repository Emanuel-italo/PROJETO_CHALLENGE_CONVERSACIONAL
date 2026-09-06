import { Alert, Platform } from "react-native";

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const fullMessage = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(fullMessage);
    return;
  }

  if (buttons.length === 1) {
    window.alert(fullMessage);
    buttons[0].onPress?.();
    return;
  }

  const confirmed = window.confirm(fullMessage);

  const pressed = confirmed
    ? buttons.find((button) => button.style !== "cancel")
    : buttons.find((button) => button.style === "cancel");

  pressed?.onPress?.();
}
