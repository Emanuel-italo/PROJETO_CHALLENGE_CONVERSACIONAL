import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Pet } from "../types";
import { aiService, ChatResult } from "../services/AiService";
import { ChatMessage, useChatHistory } from "./useChatHistory";

/**
 * Orquestra a conversa com o assistente: mantém o histórico persistido,
 * dispara a requisição via TanStack Query e expõe a última triagem
 * (urgência + ação sugerida) para a tela renderizar o call to action.
 *
 * A tela não conhece HTTP: toda a integração fica neste hook e no AiService.
 */
export function useAiChat(pet: Pet | null) {
  const { messages, addMessage, updateMessage, clearHistory, loading } = useChatHistory();
  const [lastResult, setLastResult] = useState<ChatResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      // 1. Filtra lixo do AsyncStorage (garante que só tenha mensagens com role e content)
      // 2. Pega apenas as últimas 19 mensagens, para que a atual seja a 20ª e não estoure o backend
      const safeHistory = messages
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-19);

      const history: ChatMessage[] = [...safeHistory, { role: "user", content: text }];
      
      // CORREÇÃO AQUI: Agora enviamos o objeto "pet" real em vez de null!
      return aiService.chat({ pet: pet, message: text, history });
    },
    onSuccess: async (result) => {
      setLastResult(result);
      await addMessage({ role: "assistant", content: result.reply });
    },
    onError: async () => {
      await addMessage({
        role: "assistant",
        content:
          "Não consegui falar com o assistente agora. Verifique sua conexão e tente de novo. " +
          "Se for uma emergência, procure a clínica diretamente.",
      });
    },
  });
  
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || mutation.isPending) return;

      await addMessage({ role: "user", content: trimmed });
      mutation.mutate(trimmed);
    },
    [addMessage, mutation],
  );

  const sendAudio = useCallback(
    async (text: string, audioUri: string, audioDuration: number) => {
      const trimmed = text.trim();
      if (!trimmed || mutation.isPending) return;

      await addMessage({ role: "user", content: trimmed, audioUri, audioDuration });
      mutation.mutate(trimmed);
    },
    [addMessage, mutation],
  );

  const reset = useCallback(async () => {
    setLastResult(null);
    await clearHistory();
  }, [clearHistory]);

  return {
    messages,
    loading,
    sending: mutation.isPending,
    error: mutation.error as Error | null,
    lastResult,
    send,
    sendAudio,
    updateMessage,
    reset,
  };
}