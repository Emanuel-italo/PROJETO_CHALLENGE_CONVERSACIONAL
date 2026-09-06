import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Medication } from "../types";
import { Colors } from "../styles/colors";
import { styles } from "../styles/MedicationCardStyles";

type Props = {
  medication: Medication;
  petName: string;
};

export default function MedicationCard({ medication, petName }: Props) {
  const color = medication.active ? Colors.accentGreen : Colors.textLight;

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: Colors.accent + "15" }]}>
        <Ionicons name="medical" size={22} color={Colors.accent} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{medication.name}</Text>

        <Text style={styles.sub}>
          Pet: {petName} · {medication.dosage}
        </Text>

        <Text style={styles.sub}>
          {medication.frequency} · até {medication.endDate || "—"}
        </Text>
      </View>

      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>
          {medication.active ? "Ativo" : "Fim"}
        </Text>
      </View>
    </View>
  );
}
