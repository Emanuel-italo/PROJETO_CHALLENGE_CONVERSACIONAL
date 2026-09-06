
import { Pet } from "../types";
import { ChatMessage } from "../hooks/useChatHistory";

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
  "https://projeto-challenge-conversacional.onrender.com";

const TIMEOUT_MS = 45000;

async function request<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  const url = `${BASE_URL}${path}`;

  console.log("CLYVO API REQUEST:", url);
  console.log("CLYVO API BODY:", JSON.stringify(body));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    console.log("CLYVO API STATUS:", response.status);

    const responseText = await response.text();

    console.log("CLYVO API RESPONSE:", responseText);

    if (!response.ok) {
      throw new Error(
        `Serviço de IA respondeu ${response.status}: ${responseText}`,
      );
    }

    return JSON.parse(responseText) as T;
  } catch (error) {
    console.error("CLYVO API ERROR:", error);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(
          "A requisição para o serviço de IA expirou após 45 segundos.",
        );
      }

      throw error;
    }

    throw new Error("Erro desconhecido ao chamar o serviço de IA.");
  } finally {
    clearTimeout(timeout);
  }
}

class AiService {
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

  async evaluate(pet: Pet): Promise<PetRisk> {
    return request<PetRisk>("/api/alerts", pet);
  }

  async evaluateAll(pets: Pet[]): Promise<PetRisk[]> {
    return request<PetRisk[]>("/api/alerts/batch", pets);
  }
}

export const aiService = new AiService();
