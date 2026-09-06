import { useQuery } from "@tanstack/react-query";

import { Pet } from "../types";
import { aiService, PetRisk } from "../services/AiService";

/**
 * Score de risco e alertas de um pet, calculados pelo motor de regras do
 * backend. Alimenta o card de saúde e o agendamento das notificações locais.
 */
export function usePetRisk(pet: Pet | null) {
  return useQuery<PetRisk>({
    queryKey: ["pet-risk", pet?.id, pet?.vaccines?.length, pet?.medications?.length],
    queryFn: () => aiService.evaluate(pet as Pet),
    enabled: !!pet,
    staleTime: 1000 * 60 * 5,
  });
}