import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { Pet } from "../types";
import { petService } from "../services/PetService";
import { useAuth } from "./useAuth";

type NewMedication = {
  name: string;
  dosage: string;
  frequency: string;
  endDate: string;
};

export function useMedications() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await petService.getAll(user.uid);
      setPets(data);
    } catch {
      setError("Não foi possível carregar os medicamentos.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addMedication = useCallback(
    async (petId: string, medication: NewMedication) => {
      if (!user) return false;

      setSaving(true);
      setError(null);

      try {
        const pet = await petService.getById(petId, user.uid);
        if (!pet) return false;

        const medications = pet.medications ?? [];

        medications.push({
          id: Date.now().toString(),
          name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          startDate: "",
          endDate: medication.endDate,
          active: true,
        });

        await petService.save({ ...pet, medications });
        await load();

        return true;
      } catch {
        setError("Não foi possível salvar o medicamento. Tente novamente.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user, load],
  );

  const toggleActive = useCallback(
    async (petId: string, medicationId: string) => {
      if (!user) return false;

      try {
        const pet = await petService.getById(petId, user.uid);
        if (!pet) return false;

        const medications = (pet.medications ?? []).map((m) =>
          m.id === medicationId ? { ...m, active: !m.active } : m,
        );

        await petService.save({ ...pet, medications });
        await load();

        return true;
      } catch {
        setError("Não foi possível atualizar o medicamento. Tente novamente.");
        return false;
      }
    },
    [user, load],
  );

  const removeMedication = useCallback(
    async (petId: string, medicationId: string) => {
      if (!user) return false;

      try {
        const pet = await petService.getById(petId, user.uid);
        if (!pet) return false;

        const medications = (pet.medications ?? []).filter(
          (m) => m.id !== medicationId,
        );

        await petService.save({ ...pet, medications });
        await load();

        return true;
      } catch {
        setError("Não foi possível remover o medicamento. Tente novamente.");
        return false;
      }
    },
    [user, load],
  );

  return {
    pets,
    loading,
    error,
    saving,
    reload: load,
    addMedication,
    toggleActive,
    removeMedication,
  };
}
