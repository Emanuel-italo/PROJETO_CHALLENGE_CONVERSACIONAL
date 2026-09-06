import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { RootStackParamList } from "../../types";

import { usePets } from "../../hooks/usePets";

import { styles } from "../../styles/AddHealthRecordScreen.styles";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AddHealthRecordScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const { pets, loading, error } = usePets();

  const [type, setType] = useState<"vaccine" | "medication">("vaccine");

  const options = [
    {
      key: "vaccine" as const,

      label: "Vacina",

      icon: "shield-checkmark",

      color: Colors.accentGreen,

      desc: "Registrar aplicação ou agendar próxima dose",

      route: "Vaccines" as const,
    },

    {
      key: "medication" as const,

      label: "Medicamento",

      icon: "medical",

      color: Colors.accentOrange,

      desc: "Adicionar medicamento em uso ou tratamento",

      route: "Medications" as const,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.title}>Saúde</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>O que deseja registrar?</Text>

        <View style={styles.typeRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.typeCard,

                type === opt.key && {
                  borderColor: opt.color,

                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                setType(opt.key);

                navigation.navigate(opt.route);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.typeIcon,

                  {
                    backgroundColor: opt.color + "20",
                  },
                ]}
              >
                <Ionicons name={opt.icon as any} size={26} color={opt.color} />
              </View>

              <Text style={styles.typeLabel}>{opt.label}</Text>

              <Text style={styles.typeDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, styles.petLabel]}>Selecionar pet</Text>

        {loading && pets.length === 0 ? (
          <ActivityIndicator size="small" color={Colors.accentLight} />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : pets.length === 0 ? (
          <View style={styles.emptyPets}>
            <Text style={styles.emptyText}>Nenhum pet cadastrado.</Text>

            <TouchableOpacity onPress={() => navigation.navigate("AddPet")}>
              <Text style={styles.linkText}>Cadastrar pet →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.petList}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={styles.petRow}
                onPress={() =>
                  navigation.navigate("PetDetail", {
                    petId: pet.id,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.petAvatar}>
                  <Ionicons name="paw" size={20} color={Colors.accentLight} />
                </View>

                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>

                  <Text style={styles.petMeta}>
                    {pet.species} · {pet.breed}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
