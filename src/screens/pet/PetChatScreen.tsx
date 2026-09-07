// PetChatScreen.tsx
//
// Mesma tela, com quatro adições:
//   1. tema claro/escuro (nenhuma cor fixa fora do theme)
//   2. respostas da IA renderizadas com markdown
//   3. seletor de pet no header (o contexto deixa de ser sempre pets[0])
//   4. chips com os alertas que o motor de regras devolveu na última resposta
//
// Layout, animações e hierarquia visual continuam iguais.
//
// Depende de dois arquivos novos:
//   src/styles/theme.ts
//   src/components/RichText.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";

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
  Alert,
  Keyboard,
  Animated,
  Easing,
  Image,
  Share,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../../types";
import { usePets } from "../../hooks/usePets";
import { useAiChat } from "../../hooks/useAiChat";
import { usePetRisk } from "../../hooks/usePetRisk";
import { ChatResult, SuggestedAction } from "../../services/AiService";
import { Theme, useTheme } from "../../styles/theme";
import RichText from "../../components/RichText";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Alias para não colidir com o Alert do react-native.
type AiAlert = ChatResult["alerts"][number];

const SUGESTOES = [
  { icon: "medkit-outline" as const, text: "A vacina dela está em dia?" },
  { icon: "restaurant-outline" as const, text: "Ele está comendo menos hoje" },
  { icon: "calendar-outline" as const, text: "Quando é o próximo check-up?" },
];

const ACOES_RAPIDAS = [
  {
    icon: "medkit-outline" as const,
    title: "Vacinas",
    subtitle: "Carteira",
    action: "atualizar_vacina" as SuggestedAction,
  },
  {
    icon: "calendar-outline" as const,
    title: "Consulta",
    subtitle: "Agendar",
    action: "agendar_consulta" as SuggestedAction,
  },
];

export default function PetChatScreen() {
  const navigation = useNavigation<Nav>();

  const theme = useTheme();
  const c = theme.colors;
  const s = useMemo(() => makeStyles(theme), [theme]);

  /* =========================================================
     PET SELECIONADO
  ========================================================= */

  const { pets } = usePets();

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const pet =
    pets.find((item) => item.id === selectedPetId) ??
    (pets.length > 0 ? pets[0] : null);

  useEffect(() => {
    if (!selectedPetId && pets.length > 0) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const { messages, sending, lastResult, send, reset } = useAiChat(pet);

  // Score de risco do pet, vindo do motor de regras do backend.
  const { data: risk } = usePetRisk(pet);

  // Texto da última resposta sendo revelado caractere a caractere.
  const [streamedText, setStreamedText] = useState("");
  const streamIndexRef = useRef(-1);
  const primeiraCargaRef = useRef(true);

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [likedMessages, setLikedMessages] = useState<
    Record<number, "like" | "dislike">
  >({});

  const scrollRef = useRef<ScrollView>(null);

  /* =========================================================
     ANIMAÇÕES GLOBAIS
  ========================================================= */

  const avatarPulse = useRef(new Animated.Value(1)).current;
  const avatarGlow = useRef(new Animated.Value(0.25)).current;
  const welcomeScale = useRef(new Animated.Value(0.92)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const triageAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(avatarPulse, {
            toValue: 1.045,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(avatarPulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(avatarGlow, {
            toValue: 0.7,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(avatarGlow, {
            toValue: 0.25,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.spring(welcomeScale, {
        toValue: 1,
        friction: 7,
        tension: 42,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      avatarPulse.stopAnimation();
      avatarGlow.stopAnimation();
    };
  }, []);

  useEffect(() => {
    if (!sending) {
      typingAnimation.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [sending]);

  useEffect(() => {
    if (!showTriage) {
      return;
    }

    triageAnimation.setValue(0);

    Animated.spring(triageAnimation, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [showTriage]);

  // Revela a resposta da IA progressivamente, como um produto de verdade.
  // Mensagens já existentes no histórico não são reanimadas.
  useEffect(() => {
    const ultima = messages[messages.length - 1];

    if (!ultima || ultima.role !== "assistant") {
      return;
    }

    const indice = messages.length - 1;

    if (primeiraCargaRef.current) {
      primeiraCargaRef.current = false;
      streamIndexRef.current = indice;
      setStreamedText(ultima.content);
      return;
    }

    if (streamIndexRef.current === indice) {
      return;
    }

    streamIndexRef.current = indice;
    setStreamedText("");

    let posicao = 0;
    const total = ultima.content.length;

    const timer = setInterval(() => {
      posicao = Math.min(total, posicao + 3);
      setStreamedText(ultima.content.slice(0, posicao));

      if (posicao >= total) {
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);

    return () => clearTimeout(timer);
  }, [messages.length, sending, streamedText]);

  // Barra de risco animada no header.
  const riskAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(riskAnim, {
      toValue: risk?.riskScore ?? 0,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [risk?.riskScore]);

  /* =========================================================
     ENVIO
  ========================================================= */

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();

    if (!content || sending) {
      return;
    }

    setInput("");
    setShowSuggestions(false);
    setShowQuickActions(false);
    setShowPetPicker(false);

    Keyboard.dismiss();

    await send(content);
  };

  /* =========================================================
     LIMPAR CONVERSA
  ========================================================= */

  const handleClearChat = () => {
    if (messages.length === 0) {
      return;
    }

    Alert.alert(
      "Limpar conversa",
      "Tem certeza que deseja apagar toda a conversa?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => {
            reset();

            setShowSuggestions(true);
            setShowQuickActions(false);
            setShowTriage(false);
            setLikedMessages({});
            setStreamedText("");
            streamIndexRef.current = -1;

            setTimeout(() => {
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            }, 100);
          },
        },
      ],
    );
  };

  /* =========================================================
     SCROLL
  ========================================================= */

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    setShowScrollButton(distanceFromBottom > 180);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  /* =========================================================
     AÇÕES
  ========================================================= */

  const acaoDestino: Partial<
    Record<SuggestedAction, keyof RootStackParamList>
  > = {
    agendar_consulta: "HealthCalendar",
    atualizar_vacina: "Vaccines",
  };

  const handleQuickAction = (action: SuggestedAction) => {
    const alvo = acaoDestino[action];

    if (!alvo) {
      return;
    }

    setShowQuickActions(false);

    navigation.navigate(alvo as never);
  };

  /* =========================================================
     TRIAGEM
  ========================================================= */

  const handleTriage = (symptom: string) => {
    setShowTriage(false);
    setShowSuggestions(false);

    handleSend(`Quero fazer uma triagem. O meu pet está com ${symptom}.`);
  };

  /* =========================================================
     FEEDBACK
  ========================================================= */

  const handleFeedback = (index: number, value: "like" | "dislike") => {
    setLikedMessages((current) => ({ ...current, [index]: value }));
  };

  /* =========================================================
     COMPARTILHAR
  ========================================================= */

  const handleShare = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch {
      // Não interrompe o funcionamento do chat
    }
  };

  /* =========================================================
     URGÊNCIA
  ========================================================= */

  const urgente =
    lastResult?.urgency === "alta" || lastResult?.urgency === "emergencia";

  const emergencia = lastResult?.urgency === "emergencia";

  const destino = lastResult
    ? acaoDestino[lastResult.suggestedAction]
    : undefined;

  /* =========================================================
     ALERTAS DO PRONTUÁRIO
  ========================================================= */

  const urgencyMeta = (urgency?: string) => {
    if (urgency === "emergencia") {
      return { cor: c.accentRed, rotulo: "EMERGÊNCIA", icone: "warning" as const };
    }
    if (urgency === "alta") {
      return { cor: c.accentOrange, rotulo: "URGENTE", icone: "alert-circle" as const };
    }
    if (urgency === "media") {
      return { cor: c.accentLight, rotulo: "AVALIAR", icone: "time-outline" as const };
    }
    return {
      cor: c.accentGreen,
      rotulo: "ROTINA",
      icone: "checkmark-circle-outline" as const,
    };
  };

  const riskCor =
    (risk?.riskScore ?? 0) >= 60
      ? c.accentRed
      : (risk?.riskScore ?? 0) >= 30
        ? c.accentOrange
        : c.accentGreen;

  const alertColor = (severity: AiAlert["severity"]) => {
    if (severity === "critico") return c.accentRed;
    if (severity === "atencao") return c.accentOrange;
    return c.accentLight;
  };

  const alertIcon = (severity: AiAlert["severity"]) => {
    if (severity === "critico") return "alert-circle" as const;
    if (severity === "atencao") return "warning-outline" as const;
    return "information-circle-outline" as const;
  };

  const alertasVisiveis = (lastResult?.alerts ?? []).slice(0, 3);

  const ultimaEhDaIa =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  const mostrarAlertas = !sending && ultimaEhDaIa && alertasVisiveis.length > 0;

  /* =========================================================
     FOTO DO PET
  ========================================================= */

  const petImage =
    (pet as any)?.imageUri ??
    (pet as any)?.photoUri ??
    (pet as any)?.image ??
    (pet as any)?.photo ??
    null;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <KeyboardAvoidingView
      style={s.safe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <View style={s.header}>
        <View style={s.headerGlowOne} />
        <View style={s.headerGlowTwo} />

        <TouchableOpacity
          style={s.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={21} color={c.white} />
        </TouchableOpacity>

        <View style={s.avatarWrapper}>
          <Animated.View
            style={[
              s.avatarGlow,
              { opacity: avatarGlow, transform: [{ scale: avatarPulse }] },
            ]}
          />

          <Animated.View
            style={[s.headerAvatar, { transform: [{ scale: avatarPulse }] }]}
          >
            {petImage ? (
              <Image source={{ uri: petImage }} style={s.petImage} />
            ) : (
              <Ionicons name="paw" size={21} color={c.white} />
            )}

            <View style={s.headerOnlineDot} />
          </Animated.View>
        </View>

        {/* Tocar no nome abre o seletor de pet */}
        <TouchableOpacity
          style={s.headerInfo}
          onPress={() => {
            if (pets.length > 1) {
              setShowPetPicker((current) => !current);
              setShowQuickActions(false);
              setShowTriage(false);
            }
          }}
          activeOpacity={pets.length > 1 ? 0.7 : 1}
        >
          <View style={s.headerNameRow}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {pet ? pet.name : "Assistente Clyvo"}
            </Text>

            {pets.length > 1 && (
              <Ionicons
                name={showPetPicker ? "chevron-up" : "chevron-down"}
                size={14}
                color="rgba(255,255,255,0.75)"
                style={s.headerChevron}
              />
            )}

            <View style={s.aiBadge}>
              <Ionicons name="sparkles" size={10} color={c.white} />

              <Text style={s.aiBadgeText}>AI</Text>
            </View>
          </View>

          <View style={s.onlineWrapper}>
            <View style={s.onlineDot} />

            <Text style={s.onlineText}>
              {pets.length > 1 ? "Toque para trocar de pet" : "Clyvo online"}
            </Text>
          </View>

          {/* Score de risco do pet, sempre visível */}
          {risk && (
            <View style={s.riskWrapper}>
              <View style={s.riskTrack}>
                <Animated.View
                  style={[
                    s.riskFill,
                    {
                      backgroundColor: riskCor,
                      width: riskAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                        extrapolate: "clamp",
                      }),
                    },
                  ]}
                />
              </View>

              <Text style={[s.riskLabel, { color: riskCor }]}>
                risco {risk.riskLabel}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.headerButton}
          onPress={() => {
            setShowQuickActions((current) => !current);
            setShowPetPicker(false);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={c.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.headerButton, s.headerDeleteButton]}
          onPress={handleClearChat}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={c.white} />
        </TouchableOpacity>
      </View>

      {/* =====================================================
          SELETOR DE PET
      ====================================================== */}

      {showPetPicker && pets.length > 1 && (
        <View style={s.quickActionsPanel}>
          <View style={s.quickActionsHeader}>
            <View>
              <Text style={s.quickActionsTitle}>Conversar sobre</Text>

              <Text style={s.quickActionsSubtitle}>
                O Clyvo usa o histórico do pet escolhido
              </Text>
            </View>

            <TouchableOpacity
              style={s.panelCloseButton}
              onPress={() => setShowPetPicker(false)}
            >
              <Ionicons name="close" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          {pets.map((item) => {
            const selecionado = item.id === pet?.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[s.petOption, selecionado && s.petOptionActive]}
                onPress={() => {
                  setSelectedPetId(item.id);
                  setShowPetPicker(false);
                }}
                activeOpacity={0.8}
              >
                <View style={s.petOptionAvatar}>
                  <Ionicons name="paw" size={16} color={c.accentLight} />
                </View>

                <View style={s.petOptionInfo}>
                  <Text style={s.petOptionName}>{item.name}</Text>

                  <Text style={s.petOptionMeta} numberOfLines={1}>
                    {[item.species, item.breed, item.age]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>

                {selecionado && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={c.accentLight}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* =====================================================
          AÇÕES RÁPIDAS
      ====================================================== */}

      {showQuickActions && (
        <View style={s.quickActionsPanel}>
          <View style={s.quickActionsHeader}>
            <View>
              <Text style={s.quickActionsTitle}>Central do Clyvo</Text>

              <Text style={s.quickActionsSubtitle}>
                Ferramentas rápidas para cuidar do seu pet
              </Text>
            </View>

            <TouchableOpacity
              style={s.panelCloseButton}
              onPress={() => setShowQuickActions(false)}
            >
              <Ionicons name="close" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={s.quickActionsRow}>
            {ACOES_RAPIDAS.map((acao) => (
              <TouchableOpacity
                key={acao.action}
                style={s.quickActionCard}
                onPress={() => handleQuickAction(acao.action)}
                activeOpacity={0.82}
              >
                <View style={s.quickActionIcon}>
                  <Ionicons name={acao.icon} size={19} color={c.accentLight} />
                </View>

                <Text style={s.quickActionTitle}>{acao.title}</Text>

                <Text style={s.quickActionSubtitle}>{acao.subtitle}</Text>

                <Ionicons
                  name="arrow-up-right"
                  size={15}
                  color={c.accentLight}
                  style={s.quickActionArrow}
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[s.quickActionCard, s.triageActionCard]}
              onPress={() => setShowTriage(true)}
              activeOpacity={0.82}
            >
              <View style={s.quickActionIcon}>
                <Ionicons
                  name="pulse-outline"
                  size={19}
                  color={c.accentLight}
                />
              </View>

              <Text style={s.quickActionTitle}>Triagem</Text>

              <Text style={s.quickActionSubtitle}>Iniciar</Text>

              <Ionicons
                name="arrow-up-right"
                size={15}
                color={c.accentLight}
                style={s.quickActionArrow}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =====================================================
          TRIAGEM
      ====================================================== */}

      {showTriage && (
        <Animated.View
          style={[
            s.triagePanel,
            {
              opacity: triageAnimation,
              transform: [
                {
                  translateY: triageAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-15, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={s.triageHeader}>
            <View>
              <View style={s.triageTitleRow}>
                <View style={s.triagePulse}>
                  <Ionicons name="pulse" size={17} color={c.white} />
                </View>

                <Text style={s.triageTitle}>Modo Triagem</Text>
              </View>

              <Text style={s.triageSubtitle}>
                O que está acontecendo com o pet?
              </Text>
            </View>

            <TouchableOpacity
              style={s.panelCloseButton}
              onPress={() => setShowTriage(false)}
            >
              <Ionicons name="close" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={s.triageGrid}>
            <TouchableOpacity
              style={s.triageItem}
              onPress={() => handleTriage("vomitando")}
            >
              <Text style={s.triageEmoji}>🤢</Text>

              <Text style={s.triageItemText}>Vômito</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.triageItem}
              onPress={() => handleTriage("com diarreia")}
            >
              <Text style={s.triageEmoji}>💧</Text>

              <Text style={s.triageItemText}>Diarreia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.triageItem}
              onPress={() => handleTriage("sem querer comer")}
            >
              <Text style={s.triageEmoji}>🍖</Text>

              <Text style={s.triageItemText}>Apetite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.triageItem}
              onPress={() => handleTriage("com dor")}
            >
              <Text style={s.triageEmoji}>🩹</Text>

              <Text style={s.triageItemText}>Dor</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* =====================================================
          URGÊNCIA
      ====================================================== */}

      {urgente && lastResult && (
        <View style={[s.banner, emergencia ? s.bannerCritico : s.bannerAlerta]}>
          <View style={s.bannerIcon}>
            <Ionicons
              name={emergencia ? "warning" : "alert-circle"}
              size={19}
              color={c.white}
            />
          </View>

          <View style={s.bannerContent}>
            <Text style={s.bannerTitle}>
              {emergencia ? "Atenção imediata" : "Atenção recomendada"}
            </Text>

            <Text style={s.bannerText}>
              {emergencia
                ? "O relato pode indicar uma situação que exige atendimento veterinário imediato."
                : "Pode ser importante avaliar o pet nas próximas 24 a 48 horas."}
            </Text>
          </View>

          <TouchableOpacity
            style={s.bannerAction}
            onPress={() => {
              Alert.alert(
                "Atendimento veterinário",
                "Procure uma clínica veterinária de confiança ou serviço de emergência da sua região.",
                [{ text: "OK", style: "default" }],
              );
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={c.white}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* =====================================================
          CHAT
      ====================================================== */}

      <View style={s.chatContainer}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* =================================================
              WELCOME
          ================================================== */}

          {messages.length === 0 && (
            <Animated.View
              style={[
                s.welcomeContainer,
                {
                  opacity: welcomeOpacity,
                  transform: [{ scale: welcomeScale }],
                },
              ]}
            >
              <View style={s.heroArea}>
                <View style={s.heroOrbitOne} />
                <View style={s.heroOrbitTwo} />

                <View style={s.heroAvatar}>
                  {petImage ? (
                    <Image source={{ uri: petImage }} style={s.heroPetImage} />
                  ) : (
                    <Ionicons name="sparkles" size={34} color={c.accentLight} />
                  )}
                </View>

                <View style={s.heroSparkle}>
                  <Ionicons name="sparkles" size={12} color={c.white} />
                </View>

                <View style={s.heroOnline}>
                  <View style={s.heroOnlineDot} />

                  <Text style={s.heroOnlineText}>ONLINE</Text>
                </View>
              </View>

              <Text style={s.welcomeBadge}>CLYVO AI</Text>

              <Text style={s.welcomeTitle}>Olá! Eu sou o Clyvo 👋</Text>

              <Text style={s.welcomeSubtitle}>
                Seu assistente inteligente para cuidar da saúde{" "}
                {pet ? `de ${pet.name}` : "do seu pet"} com mais praticidade.
              </Text>

              <View style={s.trustRow}>
                <View style={s.trustItem}>
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color={c.accentGreen}
                  />

                  <Text style={s.trustText}>Histórico</Text>
                </View>

                <View style={s.trustDivider} />

                <View style={s.trustItem}>
                  <Ionicons name="flash" size={13} color={c.accentLight} />

                  <Text style={s.trustText}>Respostas rápidas</Text>
                </View>

                <View style={s.trustDivider} />

                <View style={s.trustItem}>
                  <Ionicons name="paw" size={13} color={c.accentLight} />

                  <Text style={s.trustText}>Pet care</Text>
                </View>
              </View>

              <View style={s.welcomeInfo}>
                <View style={s.infoIcon}>
                  <Ionicons
                    name="sparkles-outline"
                    size={19}
                    color={c.accentLight}
                  />
                </View>

                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>Assistência inteligente</Text>

                  <Text style={s.infoText}>
                    O Clyvo usa as informações disponíveis do seu pet como
                    contexto da conversa.
                  </Text>
                </View>

                <View style={s.infoStatus}>
                  <View style={s.infoStatusDot} />
                </View>
              </View>

              {/* TRIAGEM INICIAL */}
              <TouchableOpacity
                style={s.triageLaunch}
                onPress={() => setShowTriage(true)}
                activeOpacity={0.82}
              >
                <View style={s.triageLaunchIcon}>
                  <Ionicons name="pulse" size={20} color={c.white} />
                </View>

                <View style={s.triageLaunchContent}>
                  <Text style={s.triageLaunchTitle}>Iniciar uma triagem</Text>

                  <Text style={s.triageLaunchText}>
                    Vamos entender os sintomas
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={c.white} />
              </TouchableOpacity>

              {/* SUGESTÕES */}
              {showSuggestions && (
                <View style={s.suggestionsContainer}>
                  <View style={s.suggestionsHeader}>
                    <View>
                      <Text style={s.suggestionsTitle}>
                        Experimente perguntar
                      </Text>

                      <Text style={s.suggestionsSubtitle}>
                        Perguntas rápidas para começar
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setShowSuggestions(false)}
                      style={s.closeSuggestion}
                    >
                      <Ionicons
                        name="close"
                        size={17}
                        color={c.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {SUGESTOES.map((sugestao, index) => (
                    <TouchableOpacity
                      key={sugestao.text}
                      style={[
                        s.suggestionCard,
                        index === 0 && s.suggestionCardHighlight,
                      ]}
                      onPress={() => handleSend(sugestao.text)}
                      activeOpacity={0.78}
                    >
                      <View style={s.suggestionIcon}>
                        <Ionicons
                          name={sugestao.icon}
                          size={18}
                          color={c.accentLight}
                        />
                      </View>

                      <Text style={s.suggestionText}>{sugestao.text}</Text>

                      <View style={s.suggestionArrow}>
                        <Ionicons
                          name="arrow-up"
                          size={15}
                          color={c.accentLight}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* =================================================
              MENSAGENS
          ================================================== */}

          {messages.map((msg, index) => {
            const isUser = msg.role === "user";

            return (
              <View
                key={index}
                style={[
                  s.messageRow,
                  isUser ? s.messageRowUser : s.messageRowAi,
                ]}
              >
                {!isUser && (
                  <View style={s.messageAvatar}>
                    <Ionicons name="sparkles" size={14} color={c.white} />
                  </View>
                )}

                <View
                  style={[
                    s.messageContent,
                    isUser ? s.messageContentUser : s.messageContentAi,
                  ]}
                >
                  <View
                    style={[s.messageLabelRow, isUser && s.messageLabelRowUser]}
                  >
                    {!isUser && <Text style={s.messageLabel}>Clyvo AI</Text>}

                    {isUser && <Text style={s.messageLabelUser}>Você</Text>}
                  </View>

                  <View style={isUser ? s.userBubble : s.aiBubble}>
                    {isUser ? (
                      <Text style={s.userText}>{msg.content}</Text>
                    ) : (
                      <>
                        {/* Cabeçalho de triagem: a classificação vira parte da resposta */}
                        {index === messages.length - 1 && lastResult && (
                          <View
                            style={[
                              s.triageTag,
                              {
                                backgroundColor: `${
                                  urgencyMeta(lastResult.urgency).cor
                                }1A`,
                                borderColor: urgencyMeta(lastResult.urgency).cor,
                              },
                            ]}
                          >
                            <Ionicons
                              name={urgencyMeta(lastResult.urgency).icone}
                              size={12}
                              color={urgencyMeta(lastResult.urgency).cor}
                            />

                            <Text
                              style={[
                                s.triageTagText,
                                { color: urgencyMeta(lastResult.urgency).cor },
                              ]}
                            >
                              {urgencyMeta(lastResult.urgency).rotulo}
                            </Text>
                          </View>
                        )}

                        <RichText
                          content={
                            index === streamIndexRef.current
                              ? streamedText || msg.content
                              : msg.content
                          }
                          style={s.aiText}
                          accentColor={c.accentLight}
                          codeBackground={theme.tint(0.12)}
                        />

                        {/* Cursor piscando enquanto o texto é revelado */}
                        {index === streamIndexRef.current &&
                          streamedText.length < msg.content.length && (
                            <View style={s.cursor} />
                          )}
                      </>
                    )}
                  </View>

                  {/* AÇÕES DA RESPOSTA */}
                  {!isUser && (
                    <View style={s.messageActions}>
                      <TouchableOpacity
                        style={s.messageAction}
                        onPress={() => handleFeedback(index, "like")}
                      >
                        <Ionicons
                          name={
                            likedMessages[index] === "like"
                              ? "thumbs-up"
                              : "thumbs-up-outline"
                          }
                          size={14}
                          color={
                            likedMessages[index] === "like"
                              ? c.accentLight
                              : c.textSecondary
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.messageAction}
                        onPress={() => handleFeedback(index, "dislike")}
                      >
                        <Ionicons
                          name={
                            likedMessages[index] === "dislike"
                              ? "thumbs-down"
                              : "thumbs-down-outline"
                          }
                          size={14}
                          color={
                            likedMessages[index] === "dislike"
                              ? c.accentLight
                              : c.textSecondary
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.messageAction}
                        onPress={() => handleShare(msg.content)}
                      >
                        <Ionicons
                          name="share-outline"
                          size={14}
                          color={c.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {isUser && (
                  <View style={s.userAvatar}>
                    <Ionicons name="person" size={14} color={c.white} />
                  </View>
                )}
              </View>
            );
          })}

          {/* =================================================
              ALERTAS DO PRONTUÁRIO
          ================================================== */}

          {/* De onde a IA tirou a informação */}
          {!sending && ultimaEhDaIa && (lastResult?.sources?.length ?? 0) > 0 && (
            <View style={s.sourcesRow}>
              <Ionicons
                name="library-outline"
                size={12}
                color={c.textSecondary}
              />

              {(lastResult?.sources ?? []).slice(0, 3).map((fonte) => (
                <View key={fonte} style={s.sourceChip}>
                  <Text style={s.sourceChipText} numberOfLines={1}>
                    {fonte.split("—").pop()?.trim() ?? fonte}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {mostrarAlertas && (
            <View style={s.alertsBlock}>
              <Text style={s.alertsLabel}>
                DO PRONTUÁRIO {pet ? `DE ${pet.name.toUpperCase()}` : ""}
              </Text>

              {alertasVisiveis.map((alerta) => (
                <View
                  key={alerta.code + alerta.title}
                  style={[
                    s.alertChip,
                    { borderLeftColor: alertColor(alerta.severity) },
                  ]}
                >
                  <Ionicons
                    name={alertIcon(alerta.severity)}
                    size={15}
                    color={alertColor(alerta.severity)}
                  />

                  <View style={s.alertChipContent}>
                    <Text style={s.alertChipTitle}>{alerta.title}</Text>

                    <Text style={s.alertChipDetail} numberOfLines={2}>
                      {alerta.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* =================================================
              CTA
          ================================================== */}

          {destino && !sending && (
            <TouchableOpacity
              style={s.cta}
              onPress={() => navigation.navigate(destino as never)}
              activeOpacity={0.82}
            >
              <View style={s.ctaIcon}>
                <Ionicons
                  name={
                    lastResult?.suggestedAction === "atualizar_vacina"
                      ? "medkit-outline"
                      : "calendar-outline"
                  }
                  size={19}
                  color={c.accentLight}
                />
              </View>

              <View style={s.ctaContent}>
                <Text style={s.ctaEyebrow}>RECOMENDADO PELO CLYVO</Text>

                <Text style={s.ctaTitle}>
                  {lastResult?.suggestedAction === "atualizar_vacina"
                    ? "Carteira de vacinas"
                    : "Agenda de saúde"}
                </Text>

                <Text style={s.ctaDescription}>
                  Acesse diretamente este recurso
                </Text>
              </View>

              <View style={s.ctaArrow}>
                <Ionicons name="chevron-forward" size={20} color={c.white} />
              </View>
            </TouchableOpacity>
          )}

          {/* =================================================
              LOADING
          ================================================== */}

          {sending && (
            <View style={s.typingRow}>
              <View style={s.messageAvatar}>
                <Ionicons name="sparkles" size={14} color={c.white} />
              </View>

              <View style={s.skeletonBubble}>
                <View style={s.skeletonHeader}>
                  <View style={s.typingDots}>
                    <Animated.View
                      style={[
                        s.typingDot,
                        {
                          opacity: typingAnimation.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.35, 1, 0.35],
                          }),
                        },
                      ]}
                    />

                    <Animated.View
                      style={[
                        s.typingDot,
                        {
                          opacity: typingAnimation.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 0.35, 1],
                          }),
                        },
                      ]}
                    />

                    <Animated.View
                      style={[
                        s.typingDot,
                        {
                          opacity: typingAnimation.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.35, 1, 0.35],
                          }),
                        },
                      ]}
                    />
                  </View>

                  <Text style={s.typingText}>
                    Consultando o histórico do pet...
                  </Text>
                </View>

                {/* Esqueleto do texto que está por vir */}
                {[0.92, 0.78, 0.55].map((largura, indice) => (
                  <Animated.View
                    key={indice}
                    style={[
                      s.skeletonLine,
                      {
                        width: `${largura * 100}%`,
                        opacity: typingAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange:
                            indice % 2 === 0 ? [0.25, 0.6, 0.25] : [0.6, 0.25, 0.6],
                        }),
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        {/* =================================================
            BOTÃO DE VOLTAR
        ================================================== */}

        {showScrollButton && (
          <TouchableOpacity
            style={s.scrollButton}
            onPress={scrollToBottom}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-down" size={18} color={c.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* =====================================================
          INPUT
      ====================================================== */}

      <View style={s.inputBar}>
        <TouchableOpacity
          style={s.plusButton}
          onPress={() => {
            setShowQuickActions((current) => !current);
            setShowPetPicker(false);
          }}
          activeOpacity={0.82}
        >
          <Ionicons
            name={showQuickActions ? "close" : "add"}
            size={22}
            color={c.accentLight}
          />
        </TouchableOpacity>

        <View style={s.inputContainer}>
          <TextInput
            style={s.input}
            placeholder="Pergunte ao Clyvo..."
            placeholderTextColor={c.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              if (Platform.OS === "ios") {
                return;
              }

              handleSend();
            }}
          />

          <View style={s.inputFooter}>
            <Text style={s.characterCount}>{input.length}/1000</Text>

            {input.length > 0 && (
              <TouchableOpacity
                onPress={() => setInput("")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={c.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            s.sendButton,
            (!input.trim() || sending) && s.sendButtonDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
          activeOpacity={0.82}
        >
          {sending ? (
            <ActivityIndicator size="small" color={c.white} />
          ) : (
            <Ionicons name="arrow-up" size={21} color={c.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/*
|--------------------------------------------------------------------------
| CLYVO AI ULTRA — estilos derivados do tema
|--------------------------------------------------------------------------
*/

const makeStyles = (theme: Theme) => {
  const c = theme.colors;
  const { overlay, tint, isDark } = theme;

  return StyleSheet.create({
    /* ===================== BASE ===================== */

    safe: {
      flex: 1,
      backgroundColor: c.background,
    },

    messagesList: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 24,
    },

    /* ===================== HEADER ===================== */

    header: {
      backgroundColor: c.primary,
      paddingHorizontal: 13,
      paddingTop: Platform.OS === "ios" ? 52 : 42,
      paddingBottom: 13,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
    },

    headerGlowOne: {
      position: "absolute",
      width: 170,
      height: 170,
      borderRadius: 85,
      right: -55,
      top: -118,
      backgroundColor: tint(0.18),
    },

    headerGlowTwo: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      left: -75,
      top: -100,
      backgroundColor: tint(0.08),
    },

    headerButton: {
      width: 39,
      height: 39,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.09)",
    },

    headerDeleteButton: {
      marginLeft: 5,
    },

    avatarWrapper: {
      width: 46,
      height: 46,
      marginLeft: 8,
      alignItems: "center",
      justifyContent: "center",
    },

    avatarGlow: {
      position: "absolute",
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tint(0.75),
    },

    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.35)",
    },

    petImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },

    headerOnlineDot: {
      position: "absolute",
      width: 9,
      height: 9,
      borderRadius: 5,
      right: -1,
      bottom: -1,
      backgroundColor: c.accentGreen,
      borderWidth: 2,
      borderColor: c.primary,
    },

    headerInfo: {
      flex: 1,
      marginLeft: 9,
    },

    headerNameRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    headerTitle: {
      color: c.white,
      fontSize: 16,
      fontWeight: "800",
      maxWidth: "60%",
    },

    headerChevron: {
      marginLeft: 4,
    },

    aiBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 7,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: "rgba(255,255,255,0.13)",
    },

    aiBadgeText: {
      color: c.white,
      fontSize: 8,
      fontWeight: "900",
      marginLeft: 2,
      letterSpacing: 0.7,
    },

    onlineWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 3,
    },

    onlineDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.accentGreen,
      marginRight: 6,
    },

    onlineText: {
      color: "rgba(255,255,255,0.68)",
      fontSize: 11,
      fontWeight: "500",
    },

    /* ===================== BARRA DE RISCO ===================== */

    riskWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },

    riskTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.16)",
      overflow: "hidden",
      maxWidth: 120,
    },

    riskFill: {
      height: 4,
      borderRadius: 2,
    },

    riskLabel: {
      fontSize: 9,
      fontWeight: "800",
      marginLeft: 7,
      letterSpacing: 0.3,
    },

    /* ===================== PAINÉIS ===================== */

    quickActionsPanel: {
      backgroundColor: c.card,
      paddingHorizontal: 13,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: overlay(0.05),
    },

    quickActionsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    quickActionsTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: "800",
    },

    quickActionsSubtitle: {
      color: c.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },

    panelCloseButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: overlay(0.035),
    },

    quickActionsRow: {
      flexDirection: "row",
      gap: 8,
    },

    quickActionCard: {
      flex: 1,
      minHeight: 94,
      borderRadius: 16,
      padding: 11,
      backgroundColor: tint(0.065),
      borderWidth: 1,
      borderColor: tint(0.14),
      position: "relative",
    },

    triageActionCard: {
      backgroundColor: tint(0.095),
    },

    quickActionIcon: {
      width: 33,
      height: 33,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.12),
    },

    quickActionTitle: {
      color: c.text,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 8,
    },

    quickActionSubtitle: {
      color: c.textSecondary,
      fontSize: 10,
      marginTop: 2,
    },

    quickActionArrow: {
      position: "absolute",
      right: 9,
      top: 10,
    },

    /* ===================== SELETOR DE PET ===================== */

    petOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 11,
      borderRadius: 14,
      marginBottom: 7,
      backgroundColor: tint(0.05),
      borderWidth: 1,
      borderColor: tint(0.1),
    },

    petOptionActive: {
      backgroundColor: tint(0.12),
      borderColor: tint(0.3),
    },

    petOptionAvatar: {
      width: 33,
      height: 33,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.12),
    },

    petOptionInfo: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },

    petOptionName: {
      color: c.text,
      fontSize: 13,
      fontWeight: "800",
    },

    petOptionMeta: {
      color: c.textSecondary,
      fontSize: 10,
      marginTop: 2,
    },

    /* ===================== TRIAGEM ===================== */

    triagePanel: {
      backgroundColor: c.card,
      paddingHorizontal: 13,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: overlay(0.05),
    },

    triageHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    triageTitleRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    triagePulse: {
      width: 31,
      height: 31,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
    },

    triageTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: "800",
      marginLeft: 8,
    },

    triageSubtitle: {
      color: c.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },

    triageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    triageItem: {
      width: "48%",
      minHeight: 64,
      borderRadius: 14,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tint(0.06),
      borderWidth: 1,
      borderColor: tint(0.12),
    },

    triageEmoji: {
      fontSize: 21,
    },

    triageItemText: {
      color: c.text,
      fontSize: 12,
      fontWeight: "700",
      marginLeft: 8,
    },

    triageLaunch: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 18,
      padding: 12,
      borderRadius: 16,
      backgroundColor: isDark ? c.secondary : c.primary,
    },

    triageLaunchIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },

    triageLaunchContent: {
      flex: 1,
      marginLeft: 10,
    },

    triageLaunchTitle: {
      color: c.white,
      fontSize: 13,
      fontWeight: "800",
    },

    triageLaunchText: {
      color: "rgba(255,255,255,0.68)",
      fontSize: 10,
      marginTop: 2,
    },

    /* ===================== ALERTA ===================== */

    banner: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
      paddingVertical: 12,
    },

    bannerAlerta: {
      backgroundColor: isDark ? "#7A4A02" : "#A96504",
    },

    bannerCritico: {
      backgroundColor: isDark ? "#8C1B12" : "#B42318",
    },

    bannerIcon: {
      width: 35,
      height: 35,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.14)",
    },

    bannerContent: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },

    bannerTitle: {
      color: c.white,
      fontSize: 13,
      fontWeight: "800",
    },

    bannerText: {
      color: "rgba(255,255,255,0.84)",
      fontSize: 11,
      marginTop: 2,
      lineHeight: 16,
    },

    bannerAction: {
      width: 31,
      height: 31,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.10)",
    },

    /* ===================== CHAT ===================== */

    chatContainer: {
      flex: 1,
      position: "relative",
    },

    /* ===================== HERO ===================== */

    welcomeContainer: {
      alignItems: "center",
      paddingTop: 22,
      paddingBottom: 20,
      paddingHorizontal: 4,
    },

    heroArea: {
      width: 130,
      height: 115,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    heroAvatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: tint(0.24),
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
    },

    heroPetImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
    },

    heroOrbitOne: {
      position: "absolute",
      width: 105,
      height: 105,
      borderRadius: 53,
      borderWidth: 1,
      borderColor: tint(0.15),
    },

    heroOrbitTwo: {
      position: "absolute",
      width: 123,
      height: 123,
      borderRadius: 62,
      borderWidth: 1,
      borderColor: tint(0.08),
    },

    heroSparkle: {
      position: "absolute",
      right: 9,
      top: 9,
      width: 25,
      height: 25,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
      borderWidth: 2,
      borderColor: c.card,
    },

    heroOnline: {
      position: "absolute",
      bottom: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? c.secondary : c.primary,
      borderWidth: 2,
      borderColor: c.card,
    },

    heroOnlineDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.accentGreen,
      marginRight: 4,
    },

    heroOnlineText: {
      color: c.white,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    welcomeBadge: {
      color: c.accentLight,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 2.2,
      marginBottom: 6,
    },

    welcomeTitle: {
      color: c.text,
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center",
    },

    welcomeSubtitle: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 8,
      maxWidth: 350,
    },

    trustRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 15,
    },

    trustItem: {
      flexDirection: "row",
      alignItems: "center",
    },

    trustText: {
      color: c.textSecondary,
      fontSize: 9,
      fontWeight: "600",
      marginLeft: 4,
    },

    trustDivider: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.textSecondary,
      opacity: 0.35,
      marginHorizontal: 9,
    },

    /* ===================== INFO ===================== */

    welcomeInfo: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 17,
      marginTop: 21,
      padding: 14,
      borderWidth: 1,
      borderColor: tint(0.1),
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.22 : 0.03,
      shadowRadius: 6,
    },

    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.1),
    },

    infoContent: {
      flex: 1,
      marginLeft: 11,
    },

    infoTitle: {
      color: c.text,
      fontSize: 13,
      fontWeight: "800",
    },

    infoText: {
      color: c.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },

    infoStatus: {
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 7,
    },

    infoStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.accentGreen,
    },

    /* ===================== SUGESTÕES ===================== */

    suggestionsContainer: {
      width: "100%",
      marginTop: 24,
    },

    suggestionsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },

    suggestionsTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: "800",
    },

    suggestionsSubtitle: {
      color: c.textSecondary,
      fontSize: 10,
      marginTop: 2,
    },

    closeSuggestion: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: overlay(0.035),
    },

    suggestionCard: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 16,
      paddingHorizontal: 12,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.04),
    },

    suggestionCardHighlight: {
      borderColor: tint(0.2),
    },

    suggestionIcon: {
      width: 35,
      height: 35,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.1),
    },

    suggestionText: {
      flex: 1,
      color: c.text,
      fontSize: 13,
      lineHeight: 18,
      marginLeft: 10,
      marginRight: 8,
    },

    suggestionArrow: {
      width: 29,
      height: 29,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.08),
    },

    /* ===================== MENSAGENS ===================== */

    messageRow: {
      width: "100%",
      flexDirection: "row",
      marginBottom: 16,
      alignItems: "flex-end",
    },

    messageRowUser: {
      justifyContent: "flex-end",
    },

    messageRowAi: {
      justifyContent: "flex-start",
    },

    messageAvatar: {
      width: 29,
      height: 29,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
      marginRight: 8,
      borderWidth: 2,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.55)",
    },

    userAvatar: {
      width: 29,
      height: 29,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? c.secondary : c.primary,
      marginLeft: 8,
    },

    messageContent: {
      maxWidth: "79%",
    },

    messageContentUser: {
      alignItems: "flex-end",
    },

    messageContentAi: {
      alignItems: "flex-start",
    },

    messageLabelRow: {
      marginLeft: 2,
      marginBottom: 4,
    },

    messageLabelRowUser: {
      alignItems: "flex-end",
    },

    messageLabel: {
      color: c.accentLight,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.6,
    },

    messageLabelUser: {
      color: c.textSecondary,
      fontSize: 9,
      fontWeight: "700",
    },

    userBubble: {
      backgroundColor: isDark ? c.secondary : c.primary,
      paddingHorizontal: 15,
      paddingVertical: 11,
      borderRadius: 18,
      borderBottomRightRadius: 5,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.07,
      shadowRadius: 5,
    },

    aiBubble: {
      backgroundColor: c.card,
      paddingHorizontal: 15,
      paddingVertical: 11,
      borderRadius: 18,
      borderBottomLeftRadius: 5,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.035),
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.22 : 0.03,
      shadowRadius: 5,
    },

    userText: {
      color: c.white,
      fontSize: 14,
      lineHeight: 21,
    },

    aiText: {
      color: c.text,
      fontSize: 14,
      lineHeight: 22,
    },

    messageActions: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      marginLeft: 2,
    },

    messageAction: {
      width: 25,
      height: 25,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 2,
    },

    /* ===================== TRIAGEM NA BOLHA ===================== */

    triageTag: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
    },

    triageTagText: {
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    cursor: {
      width: 7,
      height: 14,
      marginTop: 4,
      borderRadius: 2,
      backgroundColor: c.accentLight,
      opacity: 0.75,
    },

    /* ===================== FONTES ===================== */

    sourcesRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 5,
      marginLeft: 36,
      marginRight: 4,
      marginTop: -6,
      marginBottom: 14,
    },

    sourceChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: tint(0.08),
      borderWidth: 1,
      borderColor: tint(0.14),
      maxWidth: 150,
    },

    sourceChipText: {
      fontSize: 9,
      fontWeight: "600",
      color: c.textSecondary,
    },

    /* ===================== SKELETON ===================== */

    skeletonBubble: {
      flex: 1,
      maxWidth: "79%",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 18,
      borderBottomLeftRadius: 5,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.035),
    },

    skeletonHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },

    skeletonLine: {
      height: 9,
      borderRadius: 5,
      marginBottom: 7,
      backgroundColor: c.textLight,
    },

    /* ===================== ALERTAS DO PRONTUÁRIO ===================== */

    alertsBlock: {
      marginLeft: 36,
      marginRight: 4,
      marginBottom: 16,
    },

    alertsLabel: {
      color: c.textSecondary,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1,
      marginBottom: 7,
    },

    alertChip: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: c.card,
      borderRadius: 12,
      borderLeftWidth: 3,
      paddingVertical: 9,
      paddingHorizontal: 11,
      marginBottom: 7,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.035),
    },

    alertChipContent: {
      flex: 1,
      marginLeft: 8,
    },

    alertChipTitle: {
      color: c.text,
      fontSize: 11,
      fontWeight: "800",
    },

    alertChipDetail: {
      color: c.textSecondary,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 2,
    },

    /* ===================== CTA ===================== */

    cta: {
      width: "88%",
      alignSelf: "flex-start",
      marginLeft: 36,
      marginBottom: 16,
      padding: 13,
      borderRadius: 17,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: tint(0.2),
      flexDirection: "row",
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 6,
    },

    ctaIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.1),
    },

    ctaContent: {
      flex: 1,
      marginLeft: 10,
    },

    ctaEyebrow: {
      color: c.accentLight,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1,
    },

    ctaTitle: {
      color: c.text,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 2,
    },

    ctaDescription: {
      color: c.textSecondary,
      fontSize: 10,
      marginTop: 2,
    },

    ctaArrow: {
      width: 31,
      height: 31,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
    },

    /* ===================== DIGITANDO ===================== */

    typingRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 16,
    },

    typingBubble: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 18,
      borderBottomLeftRadius: 5,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.035),
    },

    typingDots: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },

    typingDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.accentLight,
    },

    typingText: {
      color: c.textSecondary,
      fontSize: 12,
      marginLeft: 8,
    },

    /* ===================== SCROLL ===================== */

    scrollButton: {
      position: "absolute",
      right: 16,
      bottom: 17,
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? c.secondary : c.primary,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 5,
    },

    /* ===================== INPUT ===================== */

    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: Platform.OS === "ios" ? 20 : 11,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: isDark ? c.border : overlay(0.05),
    },

    plusButton: {
      width: 42,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 7,
      backgroundColor: tint(0.09),
    },

    inputContainer: {
      flex: 1,
      minHeight: 48,
      maxHeight: 115,
      borderRadius: 17,
      backgroundColor: c.background,
      paddingHorizontal: 13,
      paddingTop: 8,
      paddingBottom: 5,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.04),
    },

    input: {
      color: c.text,
      fontSize: 14,
      lineHeight: 20,
      maxHeight: 75,
      padding: 0,
    },

    inputFooter: {
      minHeight: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 6,
      marginTop: 2,
    },

    characterCount: {
      fontSize: 9,
      color: c.textSecondary,
    },

    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      backgroundColor: isDark ? c.accent : c.primary,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 5,
    },

    sendButtonDisabled: {
      backgroundColor: isDark ? "#2A3852" : "#CBD3DC",
      elevation: 0,
      shadowOpacity: 0,
    },
  });
};