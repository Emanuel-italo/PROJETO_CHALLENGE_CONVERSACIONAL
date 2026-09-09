
import { Platform } from "react-native";
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

const TIMEOUT_MS = 90000;

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

const AUDIO_MIME_BY_EXT: Record<string, string> = {
  m4a: "audio/m4a",
  mp4: "audio/mp4",
  caf: "audio/x-caf",
  wav: "audio/wav",
  webm: "audio/webm",
  ogg: "audio/ogg",
  "3gp": "audio/3gpp",
};

async function transcreverAudio(uri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const gravado = await fetch(uri);
    const blob = await gravado.blob();
    const extensao = blob.type.split("/").pop() || "webm";
    formData.append("file", blob, `gravacao.${extensao}`);
  } else {
    const extensao = uri.split(".").pop()?.toLowerCase() || "m4a";
    const tipo = AUDIO_MIME_BY_EXT[extensao] || "audio/m4a";
    formData.append("file", {
      uri,
      name: `gravacao.${extensao}`,
      type: tipo,
    } as unknown as Blob);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  console.log("CLYVO STT REQUEST:", `${BASE_URL}/api/speech/transcribe`);

  try {
    const response = await fetch(`${BASE_URL}/api/speech/transcribe`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    console.log("CLYVO STT STATUS:", response.status);

    const texto = await response.text();

    console.log("CLYVO STT RESPONSE:", texto);

    if (!response.ok) {
      throw new Error(`Serviço de voz respondeu ${response.status}: ${texto}`);
    }

    const dados = JSON.parse(texto) as { text: string };
    return dados.text;
  } catch (error) {
    console.error("CLYVO STT ERROR:", error);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A transcrição de voz demorou demais e foi cancelada.");
    }
    throw error;
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

  async transcribe(uri: string): Promise<string> {
    return transcreverAudio(uri);
  }
}

export const aiService = new AiService();
