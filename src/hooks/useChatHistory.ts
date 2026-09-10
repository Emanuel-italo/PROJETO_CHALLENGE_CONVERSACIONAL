import { useCallback, useEffect, useState } from "react";

import { storageService } from "../services/StorageService";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_KEY = "@clyvo:chat_history";

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
    let updated: ChatMessage[] = [];

    setMessages((current) => {
      updated = [...current, message];
      return updated;
    });

    await storageService.saveData(CHAT_KEY, JSON.stringify(updated));
  }, []);

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
    clearHistory,
  };
}
