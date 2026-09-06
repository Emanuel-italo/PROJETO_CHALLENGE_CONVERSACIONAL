import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Pet } from "../types";
import { Colors } from "../styles/colors";
import { calcularIdadeTexto } from "../utils/formatters";
import { petService } from "../services/PetService";
import { styles } from "../styles/PetCardStyles";

type Props = {
  pet: Pet;
  onPress: (id: string) => void;
};

export default function PetCard({ pet, onPress }: Props) {
  const score = petService.getHealthScore(pet);

  const scoreColor =
    score > 70
      ? Colors.accentGreen
      : score > 40
        ? Colors.accentOrange
        : Colors.accentRed;

  const speciesIcon =
    pet.species === "Gato"
      ? "happy"
      : pet.species === "Pássaro"
        ? "sunny"
        : "paw";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(pet.id)}
      activeOpacity={0.85}
    >
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Ionicons name={speciesIcon as any} size={32} color={Colors.accent} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{pet.name}</Text>

          <Text style={styles.meta}>
            {pet.species} · {pet.breed}
          </Text>

          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{calcularIdadeTexto(pet.age)}</Text>
            </View>

            <View style={styles.tag}>
              <Text style={styles.tagText}>{pet.weight} kg</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
      </View>

      <View style={styles.healthRow}>
        <Text style={styles.healthLabel}>Saúde</Text>

        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${score}%` as any,
                backgroundColor: scoreColor,
              },
            ]}
          />
        </View>

        <Text style={[styles.healthPct, { color: scoreColor }]}>{score}%</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons
            name="shield-checkmark"
            size={13}
            color={Colors.accentGreen}
          />

          <Text style={styles.statText}>
            {pet.vaccines?.filter((v) => v.done).length ?? 0}/
            {pet.vaccines?.length ?? 0} vacinas
          </Text>
        </View>

        <View style={styles.stat}>
          <Ionicons name="medical" size={13} color={Colors.accent} />

          <Text style={styles.statText}>
            {pet.medications?.filter((m) => m.active).length ?? 0} medicamentos
          </Text>
        </View>

        <View style={styles.stat}>
          <Ionicons name="calendar" size={13} color={Colors.accentOrange} />

          <Text style={styles.statText}>
            {pet.nextCheckup || "Sem retorno"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
