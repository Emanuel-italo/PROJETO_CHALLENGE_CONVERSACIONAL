import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { Pet } from "../types";
import { petService } from "../services/PetService";
import { useAuth } from "./useAuth";

export function usePet(petId?: string) {
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!petId || !user) {
      setPet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await petService.getById(petId, user.uid);
      setPet(data);
    } catch {
      setError("Não foi possível carregar os dados do pet.");
    } finally {
      setLoading(false);
    }
  }, [petId, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = useCallback(async (data: Pet) => {
    try {
      await petService.save(data);
      return true;
    } catch {
      setError("Não foi possível salvar o pet. Tente novamente.");
      return false;
    }
  }, []);

  const remove = useCallback(async () => {
    if (!petId || !user) return false;

    try {
      await petService.remove(petId, user.uid);
      return true;
    } catch {
      setError("Não foi possível remover o pet. Tente novamente.");
      return false;
    }
  }, [petId, user]);

  return { pet, loading, error, reload: load, save, remove };
}
