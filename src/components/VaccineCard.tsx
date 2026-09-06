import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Vaccine } from "../types";
import { Colors } from "../styles/colors";
import { obterCorStatus, obterTextoStatus } from "../utils/formatters";

import { styles } from "../styles/VaccineCardStyles";

type Props = {
  vaccine: Vaccine;
  petName: string;
};

export default function VaccineCard({ vaccine, petName }: Props) {
  const cor = obterCorStatus(vaccine.done ? "done" : "pendente");

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: cor + "20",
          },
        ]}
      >
        <Ionicons
          name={vaccine.done ? "checkmark-circle" : "time"}
          size={22}
          color={cor}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{vaccine.name}</Text>

        <Text style={styles.sub}>Pet: {petName}</Text>

        <View style={styles.dates}>
          <Text style={styles.date}>Aplicada: {vaccine.date || "—"}</Text>

          <Text style={styles.date}>Próxima: {vaccine.nextDue || "—"}</Text>
        </View>
      </View>

      <View
        style={[
          styles.badge,
          {
            backgroundColor: cor,
          },
        ]}
      >
        <Text style={styles.badgeText}>
          {obterTextoStatus(vaccine.done ? "done" : "pendente")}
        </Text>
      </View>
    </View>
  );
}
