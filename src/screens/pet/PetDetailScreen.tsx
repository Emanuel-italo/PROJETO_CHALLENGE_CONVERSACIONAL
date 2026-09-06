import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { showAlert } from "../../utils/showAlert";

import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../../types";

import { Colors } from "../../styles/colors";

import { petService } from "../../services/PetService";
import { usePet } from "../../hooks/usePet";

import VaccineCard from "../../components/VaccineCard";
import MedicationCard from "../../components/MedicationCard";

import { calcularIdadeTexto } from "../../utils/formatters";

import { styles } from "../../styles/PetDetailScreenStyles";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Route = RouteProp<RootStackParamList, "PetDetail">;

type Tab = "info" | "vacinas" | "medicamentos";

export default function PetDetailScreen() {
  const navigation = useNavigation<Nav>();

  const route = useRoute<Route>();

  const petId = route?.params?.petId;

  const [tab, setTab] = useState<Tab>("info");

  const { pet, loading, error, remove } = usePet(petId);

  const handleDelete = () => {
    if (!pet || !petId) {
      return;
    }

    showAlert("Remover", `Remover ${pet.name}?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          const ok = await remove();

          if (!ok) {
            showAlert(
              "Erro ao remover",
              "Não foi possível remover o pet. Tente novamente.",
            );
            return;
          }

          navigation.goBack();
        },
      },
    ]);
  };

  if (!petId) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Pet não encontrado</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accentLight} />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{error ?? "Pet não encontrado"}</Text>
      </View>
    );
  }

  const score = petService.getHealthScore(pet);

  const scoreColor =
    score > 70
      ? Colors.accentGreen
      : score > 40
        ? Colors.accentOrange
        : Colors.accentRed;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{pet.name}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate("AddPet", { petId })}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color={Colors.accentLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={19} color={Colors.accentRed} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons
              name={pet.species === "Gato" ? "happy" : "paw"}
              size={42}
              color={Colors.accentLight}
            />
          </View>

          <Text style={styles.petName}>{pet.name}</Text>

          <Text style={styles.petMeta}>
            {pet.species} · {pet.breed}
          </Text>

          <View
            style={[
              styles.ring,
              {
                borderColor: scoreColor,
              },
            ]}
          >
            <Text
              style={[
                styles.ringNum,
                {
                  color: scoreColor,
                },
              ]}
            >
              {score}%
            </Text>

            <Text style={styles.ringLabel}>Saúde</Text>
          </View>

          <View style={styles.chips}>
            {[
              {
                icon: "calendar-outline",
                text: calcularIdadeTexto(pet.age),
              },
              {
                icon: "fitness-outline",
                text: `${pet.weight} kg`,
              },
              {
                icon: "color-palette-outline",
                text: pet.color,
              },
            ].map((c, i) => (
              <View key={i} style={styles.chip}>
                <Ionicons
                  name={c.icon as any}
                  size={13}
                  color={Colors.textSecondary}
                />

                <Text style={styles.chipText}>{c.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text
              style={[
                styles.statVal,
                {
                  color: Colors.accentGreen,
                },
              ]}
            >
              {pet.vaccines?.filter((v) => v.done).length ?? 0}/
              {pet.vaccines?.length ?? 0}
            </Text>

            <Text style={styles.statLabel}>Vacinas</Text>
          </View>

          <View style={styles.statDiv} />

          <View style={styles.stat}>
            <Text
              style={[
                styles.statVal,
                {
                  color: Colors.accentLight,
                },
              ]}
            >
              {pet.medications?.filter((m) => m.active).length ?? 0}
            </Text>

            <Text style={styles.statLabel}>Medicamentos</Text>
          </View>

          <View style={styles.statDiv} />

          <View style={styles.stat}>
            <Text
              style={[
                styles.statVal,
                {
                  color: Colors.accentOrange,
                  fontSize: 12,
                },
              ]}
            >
              {pet.nextCheckup || "—"}
            </Text>

            <Text style={styles.statLabel}>Retorno</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {(["info", "vacinas", "medicamentos"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tab === t && styles.tabBtnTextActive,
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "info" && (
          <View style={styles.infoBlock}>
            {[
              ["Nome", pet.name],
              ["Espécie", pet.species],
              ["Raça", pet.breed],
              ["Idade", calcularIdadeTexto(pet.age)],
              ["Peso", `${pet.weight} kg`],
              ["Cor", pet.color],
              ["Próximo retorno", pet.nextCheckup || "Não agendado"],
              [
                "Cadastrado",
                new Date(pet.createdAt).toLocaleDateString("pt-BR"),
              ],
            ].map(([k, v], i, arr) => (
              <View
                key={i}
                style={[
                  styles.infoRow,
                  i === arr.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <Text style={styles.infoKey}>{k}</Text>

                <Text style={styles.infoVal}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === "vacinas" &&
          ((pet.vaccines ?? []).length === 0 ? (
            <Text style={styles.noData}>Nenhuma vacina registrada</Text>
          ) : (
            pet.vaccines!.map((v, i) => (
              <VaccineCard key={i} vaccine={v} petName={pet.name} />
            ))
          ))}

        {tab === "medicamentos" &&
          ((pet.medications ?? []).length === 0 ? (
            <Text style={styles.noData}>Nenhum medicamento registrado</Text>
          ) : (
            pet.medications!.map((m, i) => (
              <MedicationCard key={i} medication={m} petName={pet.name} />
            ))
          ))}
      </ScrollView>
    </View>
  );
}
