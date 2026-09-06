// PetChatScreen.tsx
//
// Mesma estrutura visual da tela anterior: header, lista de mensagens, barra de
// input. As mudanças são funcionais — a resposta agora vem do serviço de IA com
// o prontuário do pet como contexto — mais uma faixa de triagem que só aparece
// quando o assistente classifica o relato como alta urgência ou emergência.

import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { RootStackParamList } from "../../types";
import { usePets } from "../../hooks/usePets";
import { useAiChat } from "../../hooks/useAiChat";
import { SuggestedAction } from "../../services/AiService";

import { styles } from "../../styles/PetChatScreen.styles";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGESTOES = [
  "A vacina dela está em dia?",
  "Ele está comendo menos hoje",
  "Quando é o próximo check-up?",
];

export default function PetChatScreen() {
  const navigation = useNavigation<Nav>();

  const { pets } = usePets();
  const pet = pets.length > 0 ? pets[0] : null;

  const { messages, sending, lastResult, send, reset } = useAiChat(pet);

  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      100,
    );
    return () => clearTimeout(timer);
  }, [messages.length, sending]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    await send(content);
  };

  const acaoDestino: Partial<Record<SuggestedAction, keyof RootStackParamList>> = {
    agendar_consulta: "HealthCalendar",
    atualizar_vacina: "Vaccines",
  };

  const urgente =
    lastResult?.urgency === "alta" || lastResult?.urgency === "emergencia";

  const destino = lastResult ? acaoDestino[lastResult.suggestedAction] : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Chat</Text>

          <Text style={styles.headerSub}>
            {pet ? `Assistente Clyvo · ${pet.name}` : "Assistente Clyvo"}
          </Text>
        </View>

        <TouchableOpacity style={styles.avatar} onPress={reset}>
          <Ionicons name="trash-outline" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {urgente && lastResult && (
        <View
          style={[
            extra.banner,
            lastResult.urgency === "emergencia" ? extra.bannerCritico : extra.bannerAlerta,
          ]}
        >
          <Ionicons
            name={lastResult.urgency === "emergencia" ? "warning" : "alert-circle"}
            size={18}
            color={Colors.white}
          />

          <Text style={extra.bannerText}>
            {lastResult.urgency === "emergencia"
              ? "Sinal de emergência — procure atendimento agora"
              : "Recomendado avaliar em 24 a 48 horas"}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <Ionicons name="sparkles" size={42} color={Colors.accentLight} />

            <Text style={styles.welcomeTitle}>Assistente Clyvo</Text>

            <Text style={styles.welcomeText}>
              {pet
                ? `Pergunte sobre a saúde de ${pet.name}. O assistente já conhece as vacinas, medicações e o histórico do app.`
                : "Cadastre um pet para receber orientação personalizada."}
            </Text>

            <View style={extra.chips}>
              {SUGESTOES.map((sugestao) => (
                <TouchableOpacity
                  key={sugestao}
                  style={extra.chip}
                  onPress={() => handleSend(sugestao)}
                >
                  <Text style={extra.chipText}>{sugestao}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === "user";

          return (
            <View
              key={index}
              style={[
                styles.msgRow,
                isUser ? styles.msgRowUser : styles.msgRowAi,
              ]}
            >
              <View style={isUser ? styles.msgBubbleUser : styles.msgBubbleAi}>
                <Text style={isUser ? styles.msgTextUser : styles.msgTextAi}>
                  {msg.content}
                </Text>
              </View>
            </View>
          );
        })}

        {destino && !sending && (
          <TouchableOpacity
            style={extra.cta}
            onPress={() => navigation.navigate(destino as never)}
          >
            <Ionicons name="calendar-outline" size={16} color={Colors.white} />

            <Text style={extra.ctaText}>
              {lastResult?.suggestedAction === "atualizar_vacina"
                ? "Ver carteira de vacinas"
                : "Abrir agenda de saúde"}
            </Text>
          </TouchableOpacity>
        )}

        {sending && (
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={Colors.accentLight} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={Colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos exclusivos dos elementos novos, para não alterar o arquivo de estilos
// existente e preservar a identidade visual da tela.
const extra = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerAlerta: { backgroundColor: "#B26B00" },
  bannerCritico: { backgroundColor: "#B3261E" },
  bannerText: { color: Colors.white, fontSize: 13, fontWeight: "600", flex: 1 },
  chips: { marginTop: 20, gap: 8, width: "100%" },
  chip: {
    borderWidth: 1,
    borderColor: Colors.accentLight,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipText: { color: Colors.accentLight, fontSize: 13, textAlign: "center" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
  },
  ctaText: { color: Colors.white, fontSize: 13, fontWeight: "600" },
});
