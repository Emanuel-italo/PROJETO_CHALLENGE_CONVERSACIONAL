import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { showAlert } from "../../utils/showAlert";

import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { RootStackParamList } from "../../types";
import { usePet } from "../../hooks/usePet";
import { useAuth } from "../../hooks/useAuth";
import { validarFormularioPet } from "../../utils/validators";

import { styles } from "../../styles/AddPetScreenStyles";

const SPECIES = ["Cachorro", "Gato", "Pássaro", "Coelho", "Outro"];

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "AddPet">;

export default function AddPetScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const petId = route.params?.petId;
  const isEditing = !!petId;

  const { user } = useAuth();
  const { pet, loading, error, save } = usePet(petId);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pet) return;

    setName(pet.name ?? "");
    setSpecies(pet.species ?? "");
    setBreed(pet.breed ?? "");
    setAge(String(pet.age ?? ""));
    setWeight(String(pet.weight ?? ""));
  }, [pet]);

  const handleSave = async () => {
    const breedEffective = breed.trim() || species;

    const validationErrors = validarFormularioPet({
      name,
      species,
      breed: breedEffective,
      age,
      weight,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const updatedPet = {
        ...(pet ?? {}),
        id: pet?.id ?? Date.now().toString(),
        ownerId: pet?.ownerId ?? user?.uid ?? "",
        name: name.trim(),
        species,
        breed: breedEffective,
        age: parseFloat(age) || 0,
        weight: parseFloat(weight) || 0,
        vaccines: pet?.vaccines ?? [],
        medications: pet?.medications ?? [],
        nextCheckup: pet?.nextCheckup ?? "",
        createdAt: pet?.createdAt ?? new Date().toISOString(),
      };

      const ok = await save(updatedPet as any);

      if (!ok) {
        showAlert(
          "Erro ao salvar",
          isEditing
            ? "Não foi possível atualizar o pet. Tente novamente."
            : "Não foi possível cadastrar o pet. Tente novamente.",
        );
        return;
      }

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Editar Pet</Text>

          <View style={{ width: 36 }} />
        </View>

        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentLight} />
          <Text style={styles.loadingText}>Carregando pet...</Text>
        </View>
      </View>
    );
  }

  if (isEditing && !loading && !pet) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Editar Pet</Text>

          <View style={{ width: 36 }} />
        </View>

        <View style={styles.center}>
          <Text style={styles.loadingText}>
            {error ?? "Pet não encontrado."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.title}>
          {isEditing ? "Editar Pet" : "Novo Pet"}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarArea}>
          <View style={styles.avatar}>
            <Ionicons
              name={
                species === "Gato"
                  ? "happy"
                  : species === "Pássaro"
                    ? "sunny"
                    : "paw"
              }
              size={40}
              color={Colors.accentLight}
            />
          </View>

          <Text style={styles.avatarHint}>
            {name.trim() ? name : "Novo pet"}
          </Text>
        </View>

        <Text style={styles.label}>Nome *</Text>

        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Ex: Thor, Luna..."
          placeholderTextColor={Colors.textLight}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setErrors((prev) => ({ ...prev, name: "" }));
          }}
        />
        {errors.name ? (
          <Text style={styles.errorText}>{errors.name}</Text>
        ) : null}

        <Text style={styles.label}>Espécie *</Text>

        <View style={styles.chipRow}>
          {SPECIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, species === s && styles.chipSelected]}
              onPress={() => {
                setSpecies(s);
                setErrors((prev) => ({ ...prev, species: "" }));
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  species === s && styles.chipTextSelected,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.species ? (
          <Text style={styles.errorText}>{errors.species}</Text>
        ) : null}

        <Text style={styles.label}>Raça</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: Labrador, Persa..."
          placeholderTextColor={Colors.textLight}
          value={breed}
          onChangeText={setBreed}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Idade (anos)</Text>

            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              placeholder="Ex: 3"
              placeholderTextColor={Colors.textLight}
              value={age}
              onChangeText={(v) => {
                setAge(v);
                setErrors((prev) => ({ ...prev, age: "" }));
              }}
              keyboardType="decimal-pad"
            />
            {errors.age ? (
              <Text style={styles.errorText}>{errors.age}</Text>
            ) : null}
          </View>

          <View style={{ width: 12 }} />

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Peso (kg)</Text>

            <TextInput
              style={[styles.input, errors.weight && styles.inputError]}
              placeholder="Ex: 12.5"
              placeholderTextColor={Colors.textLight}
              value={weight}
              onChangeText={(v) => {
                setWeight(v);
                setErrors((prev) => ({ ...prev, weight: "" }));
              }}
              keyboardType="decimal-pad"
            />
            {errors.weight ? (
              <Text style={styles.errorText}>{errors.weight}</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
          )}

          <Text style={styles.saveBtnText}>
            {saving
              ? "Salvando..."
              : isEditing
                ? "Salvar Alterações"
                : "Salvar Pet"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
