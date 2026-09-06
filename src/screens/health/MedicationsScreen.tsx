// MedicationsScreen.tsx

import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { showAlert } from "../../utils/showAlert";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { RootStackParamList } from "../../types";

import { styles } from "../../styles/MedicationsScreenStyles";

import { useMedications } from "../../hooks/useMedications";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MedicationsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const {
    pets,
    loading,
    error,
    saving,
    reload,
    addMedication,
    toggleActive,
    removeMedication,
  } = useMedications();

  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedPetId, setSelectedPetId] = useState("");

  const [medName, setMedName] = useState("");

  const [dosage, setDosage] = useState("");

  const [frequency, setFrequency] = useState("");

  const [endDate, setEndDate] = useState("");

  const onRefresh = async () => {
    setRefreshing(true);

    await reload();

    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (!selectedPetId) {
      showAlert("Atenção", "Selecione o pet do medicamento.");
      return;
    }

    if (!medName.trim()) {
      showAlert("Atenção", "Informe o nome do medicamento.");
      return;
    }

    const ok = await addMedication(selectedPetId, {
      name: medName.trim(),
      dosage,
      frequency,
      endDate,
    });

    if (!ok) {
      showAlert(
        "Erro ao salvar",
        "Não foi possível salvar o medicamento. Tente novamente.",
      );
      return;
    }

    setModalVisible(false);

    setMedName("");
    setDosage("");
    setFrequency("");
    setEndDate("");
    setSelectedPetId("");
  };

  const handleToggleActive = async (petId: string, medId: string) => {
    const ok = await toggleActive(petId, medId);

    if (!ok) {
      showAlert(
        "Erro",
        "Não foi possível atualizar o medicamento. Tente novamente.",
      );
    }
  };

  const handleDelete = async (petId: string, medId: string) => {
    showAlert("Remover medicamento", "Deseja remover?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Remover",
        style: "destructive",

        onPress: async () => {
          const ok = await removeMedication(petId, medId);

          if (!ok) {
            showAlert(
              "Erro ao remover",
              "Não foi possível remover o medicamento. Tente novamente.",
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.title}>Medicamentos</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
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

          {pets.flatMap((pet) =>
            (pet.medications ?? []).map((m) => {
              const color = m.active ? Colors.accentOrange : Colors.textLight;

              return (
                <View key={m.id} style={styles.card}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: Colors.accentOrange + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name="medical"
                      size={22}
                      color={Colors.accentOrange}
                    />
                  </View>

                  <View style={styles.flexOne}>
                    <Text style={styles.medName}>{m.name}</Text>

                    <Text style={styles.medSub}>
                      Pet: {pet.name} · {m.dosage}
                    </Text>

                    <Text style={styles.medSub}>
                      {m.frequency}
                      {m.endDate ? ` · até ${m.endDate}` : ""}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => handleToggleActive(pet.id, m.id)}
                      style={styles.actionBtn}
                    >
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: color,
                          },
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {m.active ? "Ativo" : "Fim"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(pet.id, m.id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name="trash"
                        size={18}
                        color={Colors.accentRed}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }),
          )}

          {pets.flatMap((p) => p.medications ?? []).length === 0 && (
            <View style={styles.empty}>
              <Ionicons
                name="medical"
                size={48}
                color={Colors.accentOrange + "40"}
              />

              <Text style={styles.emptyText}>
                Nenhum medicamento cadastrado
              </Text>

              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.emptyBtnText}>Adicionar medicamento</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Novo Medicamento</Text>

            <Text style={styles.inputLabel}>Pet</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.petScroll}
            >
              <View style={styles.petScrollRow}>
                {pets.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.petChip,
                      selectedPetId === p.id && styles.petChipSelected,
                    ]}
                    onPress={() => setSelectedPetId(p.id)}
                  >
                    <Text
                      style={[
                        styles.petChipText,
                        selectedPetId === p.id && styles.petChipTextSelected,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Nome do medicamento</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: Simparic, Bravecto..."
              placeholderTextColor={Colors.textLight}
              value={medName}
              onChangeText={setMedName}
            />

            <Text style={styles.inputLabel}>Dosagem</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: 1 comprimido"
              placeholderTextColor={Colors.textLight}
              value={dosage}
              onChangeText={setDosage}
            />

            <Text style={styles.inputLabel}>Frequência</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: 1x ao dia"
              placeholderTextColor={Colors.textLight}
              value={frequency}
              onChangeText={setFrequency}
            />

            <Text style={styles.inputLabel}>Data de término</Text>

            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={Colors.textLight}
              value={endDate}
              onChangeText={setEndDate}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
