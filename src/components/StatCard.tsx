import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../styles/colors";
import { styles } from "../styles/StatCardStyles";

type Props = {
  label: string;
  value: number | string;
  icon: string;
  color: string;
};

export default function StatCard({ label, value, icon, color }: Props) {
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: color + "20",
          },
        ]}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>

      <Text style={styles.value}>{value}</Text>

      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
