// HealthTabScreen.tsx

import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { RootStackParamList } from "../../types";

import { styles } from "../../styles/HealthTabStyles";

import { petService } from "../../services/PetService";
import { usePets } from "../../hooks/usePets";

import { calcularIdadeTexto } from "../../utils/formatters";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HealthTabScreen() {
  const navigation = useNavigation<Nav>();

  const { pets, loading, error, reload } = usePets();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);

    await reload();

    setRefreshing(false);
  };

  const getPetIcon = (species: string) => {
    if (species === "Gato") {
      return "logo-octocat";
    }

    if (species === "Pássaro") {
      return "leaf";
    }

    return "paw";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.addButton}
          onPress={() => navigation.navigate("AddHealthRecord")}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading && pets.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={Colors.accentLight} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accentLight}
            />
          }
        >
          {error && <Text style={styles.emptyText}>{error}</Text>}

          {pets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="heart"
                  size={52}
                  color={Colors.accentRed + "55"}
                />
              </View>

              <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>

              <Text style={styles.emptyText}>
                Adicione um pet para acompanhar a saúde
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.emptyButton}
                onPress={() => navigation.navigate("AddPet")}
              >
                <Text style={styles.emptyButtonText}>Adicionar Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pets.map((pet) => {
              const score = petService.getHealthScore(pet);

              const scoreColor =
                score >= 70
                  ? Colors.accentGreen
                  : score >= 40
                    ? Colors.accentOrange
                    : Colors.accentRed;

              const vaccinesDone = (pet.vaccines ?? []).filter(
                (item: any) => item.done,
              ).length;

              const vaccinesTotal = (pet.vaccines ?? []).length;

              const activeMedications = (pet.medications ?? []).filter(
                (item: any) => item.active,
              ).length;

              const pendingVaccines = (pet.vaccines ?? []).filter(
                (item: any) => !item.done,
              ).length;

              return (
                <TouchableOpacity
                  key={pet.id}
                  activeOpacity={0.9}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate("PetDetail", {
                      petId: pet.id,
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Ionicons
                        name={getPetIcon(pet.species)}
                        size={24}
                        color={Colors.accentLight}
                      />
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.petName}>{pet.name}</Text>

                      <Text style={styles.petMeta}>
                        {pet.species} • {pet.breed} •{" "}
                        {calcularIdadeTexto(pet.age)}
                      </Text>
                    </View>

                    {pendingVaccines > 0 && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>
                          {pendingVaccines} pendente
                          {pendingVaccines > 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.textLight}
                    />
                  </View>

                  <View style={styles.healthContainer}>
                    <Text style={styles.healthLabel}>Saúde</Text>

                    <View style={styles.progressBackground}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${score}%`,
                            backgroundColor: scoreColor,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.healthValue,
                        {
                          color: scoreColor,
                        },
                      ]}
                    >
                      {score}%
                    </Text>
                  </View>

                  <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                      <Ionicons
                        name="shield-checkmark"
                        size={14}
                        color={Colors.accentGreen}
                      />

                      <Text style={styles.statText}>
                        {vaccinesDone}/{vaccinesTotal} vacinas
                      </Text>
                    </View>

                    <View style={styles.stat}>
                      <Ionicons
                        name="medical"
                        size={14}
                        color={Colors.accentOrange}
                      />

                      <Text style={styles.statText}>
                        {activeMedications} meds
                      </Text>
                    </View>
                  </View>

                  <View style={styles.checkupContainer}>
                    <Ionicons
                      name="calendar"
                      size={14}
                      color={Colors.accentLight}
                    />

                    <Text style={styles.checkupText}>
                      Próximo retorno: {pet.nextCheckup || "Não definido"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
