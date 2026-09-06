import React from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../styles/colors";
import { styles } from "../styles/InputFieldStyles";

type Props = TextInputProps & {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  dark?: boolean;
};

export default function InputField({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  dark = false,
  ...props
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, dark ? styles.labelDark : styles.labelLight]}>
        {label}
      </Text>

      <View
        style={[
          styles.inputBox,
          dark ? styles.inputBoxDark : styles.inputBoxLight,
          error ? styles.inputBoxError : null,
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}

        <TextInput
          style={[
            styles.input,
            dark ? styles.inputTextDark : styles.inputTextLight,
          ]}
          placeholderTextColor={
            dark ? "rgba(255,255,255,0.35)" : Colors.textLight
          }
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.iconRight}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
