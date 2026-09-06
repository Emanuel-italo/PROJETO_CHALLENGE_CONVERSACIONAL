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

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { RootStackParamList } from "../../types";
import { petService } from "../../services/PetService";
import { calcularIdadeTexto } from "../../utils/formatters";
import { usePets } from "../../hooks/usePets";

import { styles } from "../../styles/PetsScreenStyles";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PetsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddPet")}
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
          contentContainerStyle={styles.list}
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
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="paw"
                  size={52}
                  color={Colors.accentLight + "55"}
                />
              </View>

              <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>

              <Text style={styles.emptyText}>
                Cadastre seu primeiro pet para começar
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.emptyBtn}
                onPress={() => navigation.navigate("AddPet")}
              >
                <Text style={styles.emptyBtnText}>Cadastrar Pet</Text>
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
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Ionicons
                        name={getPetIcon(pet.species)}
                        size={24}
                        color={Colors.accentLight}
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text style={styles.petName}>{pet.name}</Text>

                      <Text style={styles.petMeta}>
                        {pet.species} • {pet.breed}
                      </Text>

                      <View style={styles.tags}>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>
                            {calcularIdadeTexto(pet.age)}
                          </Text>
                        </View>

                        <View style={styles.tag}>
                          <Text style={styles.tagText}>{pet.weight} kg</Text>
                        </View>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Colors.textLight}
                    />
                  </View>

                  <View style={styles.healthRow}>
                    <Text style={styles.healthLabel}>Saúde</Text>

                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${score}%`,
                            backgroundColor: scoreColor,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.healthPct,
                        {
                          color: scoreColor,
                        },
                      ]}
                    >
                      {score}%
                    </Text>
                  </View>

                  <View style={styles.statsRow}>
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
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
