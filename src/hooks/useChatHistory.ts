import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addMessage = useCallback(async (message: ChatMessage) => {
    setMessages((current) => {
      const updated = [...current, message];
      storageService.saveData(CHAT_KEY, JSON.stringify(updated));
      return updated;
    });
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
