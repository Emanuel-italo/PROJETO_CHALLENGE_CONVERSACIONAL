import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { Pet } from "../types";
import { petService } from "../services/PetService";
import { useAuth } from "./useAuth";

export function usePets() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError("Não foi possível carregar os pets.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { pets, loading, error, reload: load };
}
