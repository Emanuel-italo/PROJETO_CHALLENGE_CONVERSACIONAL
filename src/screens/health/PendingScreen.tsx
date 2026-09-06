// PendingScreen.tsx

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
import { usePets } from "../../hooks/usePets";

import { styles } from "../../styles/PendingScreenStyles";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PendingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const { pets, loading, error, reload } = usePets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);

    await reload();

    setRefreshing(false);
  };

  const pending = pets.flatMap((pet) =>
    (pet.vaccines ?? [])
      .filter((v: any) => !v.done)
      .map((v: any) => ({
        ...v,
        petName: pet.name,
        type: "Vacina",
      })),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.title}>Pendências</Text>

        <View style={styles.headerSpacer} />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accentLight}
            />
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && <Text style={styles.emptyText}>{error}</Text>}

          {pending.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="checkmark-circle"
                size={56}
                color={Colors.accentGreen + "60"}
              />

              <Text style={styles.emptyTitle}>Tudo em dia! 🎉</Text>

              <Text style={styles.emptyText}>Nenhuma vacina pendente</Text>

              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate("Vaccines")}
              >
                <Text style={styles.emptyBtnText}>Ver vacinas</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pending.map((item, i) => (
              <View key={i} style={styles.card}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: Colors.accentRed + "20",
                    },
                  ]}
                >
                  <Ionicons name="time" size={22} color={Colors.accentRed} />
                </View>

                <View style={styles.info}>
                  <Text style={styles.itemName}>{item.name}</Text>

                  <Text style={styles.itemSub}>
                    Pet: {item.petName} · {item.type}
                  </Text>

                  {item.nextDue ? (
                    <Text style={styles.itemDate}>
                      Prevista: {item.nextDue}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => navigation.navigate("Vaccines")}
                >
                  <Text style={styles.resolveBtnText}>Resolver</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
