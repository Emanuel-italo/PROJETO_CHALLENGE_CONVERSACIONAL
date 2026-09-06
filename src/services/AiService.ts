import { Pet } from "../types";
import { ChatMessage } from "../hooks/useChatHistory";

/**
 * Cliente HTTP do serviço de IA da Clyvo.
 *
 * A URL vem de `EXPO_PUBLIC_AI_API_URL` (arquivo .env na raiz do projeto).
 * Nenhuma chave de LLM trafega pelo app: o segredo vive apenas no backend.
 */

export type Urgency = "baixa" | "media" | "alta" | "emergencia";

export type SuggestedAction =
  | "nenhuma"
  | "cuidado_em_casa"
  | "agendar_consulta"
  | "atualizar_vacina"
  | "procurar_emergencia";

export type Alert = {
  code: string;
  severity: "info" | "atencao" | "critico";
  title: string;
  detail: string;
  dueDate?: string | null;
};

export type ChatResult = {
  reply: string;
  urgency: Urgency;
  suggestedAction: SuggestedAction;
  reason: string;
  sources: string[];
  alerts: Alert[];
  simulated: boolean;
};

export type PetRisk = {
  petId: string;
  petName: string;
  riskScore: number;
  riskLabel: "baixo" | "medio" | "alto";
  alerts: Alert[];
};

const BASE_URL =
  process.env.EXPO_PUBLIC_AI_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

const TIMEOUT_MS = 45000;

async function request<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Serviço de IA respondeu ${response.status}: ${detail}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

class AiService {
  /** Envia a mensagem do tutor com o prontuário do pet como contexto. */
  async chat(params: {
    pet: Pet | null;
    message: string;
    history: ChatMessage[];
  }): Promise<ChatResult> {
    return request<ChatResult>("/api/chat", {
      pet: params.pet,
      message: params.message,
      history: params.history.slice(-8),
    });
  }

  /** Score de risco e alertas de um pet (motor de regras, sem LLM). */
  async evaluate(pet: Pet): Promise<PetRisk> {
    return request<PetRisk>("/api/alerts", pet);
  }

  /** Avaliação em lote, ordenada por risco. */
  async evaluateAll(pets: Pet[]): Promise<PetRisk[]> {
    return request<PetRisk[]>("/api/alerts/batch", pets);
  }
}

export const aiService = new AiService();