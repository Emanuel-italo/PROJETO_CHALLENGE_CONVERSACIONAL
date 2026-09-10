import { useCallback, useEffect, useState } from "react";

import { storageService } from "../services/StorageService";

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  /** Presente quando a mensagem tem áudio tocável (enviado por voz, ou a
   * resposta da IA sintetizada em voz). */
  audioUri?: string;
  /** Duração aproximada em segundos, usada antes do player carregar. */
  audioDuration?: number;
  /** Instante do envio (ms desde epoch) — mostrado como horário na bolha. */
  timestamp?: number;
};

const CHAT_KEY = "@clyvo:chat_history";

function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = await storageService.getData(CHAT_KEY);
      setMessages(raw ? JSON.parse(raw) : []);
    } catch {
      setError("Não foi possível carregar o histórico do chat.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega uma vez, na montagem. NUNCA em foco/re-foco: recarregar a
  // cada foco (ex.: o navegador pede permissão do microfone e a aba
  // perde/recupera o foco) sobrescrevia o chat em memória com a última
  // versão salva em disco, apagando mensagens que ainda não tinham
  // terminado de persistir.
  useEffect(() => {
    load();
  }, [load]);

  const addMessage = useCallback(async (message: ChatMessage) => {
    const comId: ChatMessage = {
      ...message,
      id: message.id ?? gerarId(),
      timestamp: message.timestamp ?? Date.now(),
    };
    let updated: ChatMessage[] = [];

    setMessages((current) => {
      updated = [...current, comId];
      return updated;
    });

    await storageService.saveData(CHAT_KEY, JSON.stringify(updated));
    return comId;
  }, []);

  const updateMessage = useCallback(
    async (id: string, patch: Partial<ChatMessage>) => {
      let updated: ChatMessage[] = [];

      setMessages((current) => {
        updated = current.map((m) => (m.id === id ? { ...m, ...patch } : m));
        return updated;
      });

      await storageService.saveData(CHAT_KEY, JSON.stringify(updated));
    },
    [],
  );

  const clearHistory = useCallback(async () => {
    setMessages([]);
    await storageService.saveData(CHAT_KEY, JSON.stringify([]));
  }, []);

  return {
    messages,
    loading,
    error,
    setMessages,
    addMessage,
    updateMessage,
    clearHistory,
  };
}
