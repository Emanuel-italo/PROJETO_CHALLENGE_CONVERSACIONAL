import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { Pet } from "../types";
import { petService } from "../services/PetService";
import { useAuth } from "./useAuth";

type NewVaccine = {
  name: string;
  date: string;
  nextDue: string;
};

export function useVaccines() {
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
      setError("Não foi possível carregar as vacinas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addVaccine = useCallback(
    async (petId: string, vaccine: NewVaccine) => {
      if (!user) return false;

      setSaving(true);
      setError(null);

      try {
        const pet = await petService.getById(petId, user.uid);
        if (!pet) return false;

        const vaccines = pet.vaccines ?? [];

        vaccines.push({
          id: Date.now().toString(),
          name: vaccine.name,
          date: vaccine.date,
          nextDue: vaccine.nextDue,
          done: !!vaccine.date,
        });

        await petService.save({ ...pet, vaccines });
        await load();

        return true;
      } catch {
        setError("Não foi possível salvar a vacina. Tente novamente.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user, load],
  );

  const toggleDone = useCallback(
    async (petId: string, vaccineId: string) => {
      if (!user) return false;

      try {
        const pet = await petService.getById(petId, user.uid);
        if (!pet) return false;

        const vaccines = (pet.vaccines ?? []).map((v) =>
          v.id === vaccineId ? { ...v, done: !v.done } : v,
        );

        await petService.save({ ...pet, vaccines });
        await load();

        return true;
      } catch {
        setError("Não foi possível atualizar a vacina. Tente novamente.");
        return false;
      }
    },
    [user, load],
  );

  const removeVaccine = useCallback(
    async (petId: string, vaccineId: string) => {
      if (!user) return false;

      try {
        const pet = await petService.getById(petId, user.uid);
        if (!pet) return false;

        const vaccines = (pet.vaccines ?? []).filter((v) => v.id !== vaccineId);

        await petService.save({ ...pet, vaccines });
        await load();

        return true;
      } catch {
        setError("Não foi possível remover a vacina. Tente novamente.");
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
    addVaccine,
    toggleDone,
    removeVaccine,
  };
}
