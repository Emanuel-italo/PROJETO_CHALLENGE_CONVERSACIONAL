
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

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
  {
    icon: "medkit-outline" as const,
    text: "A vacina dela está em dia?",
  },
  {
    icon: "restaurant-outline" as const,
    text: "Ele está comendo menos hoje",
  },
  {
    icon: "calendar-outline" as const,
    text: "Quando é o próximo check-up?",
  },
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

  const { pets } = usePets();
  const pet = pets.length > 0 ? pets[0] : null;

  const {
    messages,
    sending,
    lastResult,
    send,
    reset,
  } = useAiChat(pet);

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  /* =========================================================
     ANIMAÇÕES
  ========================================================= */

  const avatarPulse = useRef(
    new Animated.Value(1),
  ).current;

  const avatarGlow = useRef(
    new Animated.Value(0.25),
  ).current;

  const welcomeScale = useRef(
    new Animated.Value(0.92),
  ).current;

  const welcomeOpacity = useRef(
    new Animated.Value(0),
  ).current;

  const typingAnimation = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(avatarPulse, {
        toValue: 1.06,
        friction: 5,
        tension: 35,
        useNativeDriver: true,
      }),

      Animated.timing(avatarGlow, {
        toValue: 0.7,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(welcomeScale, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),

      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!sending) {
      typingAnimation.setValue(0);
      return;
    }

    Animated.loop(
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
    ).start();
  }, [sending]);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        scrollRef.current?.scrollToEnd({
          animated: true,
        }),
      100,
    );

    return () => clearTimeout(timer);
  }, [messages.length, sending]);

  /* =========================================================
     ENVIO
  ========================================================= */

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();

    if (!content || sending) return;

    setInput("");
    setShowSuggestions(false);
    setShowQuickActions(false);

    Keyboard.dismiss();

    await send(content);
  };

  /* =========================================================
     LIMPAR CHAT
  ========================================================= */

  const handleClearChat = () => {
    if (messages.length === 0) {
      return;
    }

    Alert.alert(
      "Limpar conversa",
      "Tem certeza que deseja apagar toda a conversa?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => {
            reset();

            setShowSuggestions(true);
            setShowQuickActions(false);

            setTimeout(() => {
              scrollRef.current?.scrollTo({
                y: 0,
                animated: true,
              });
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
    const {
      contentOffset,
      contentSize,
      layoutMeasurement,
    } = event.nativeEvent;

    const distanceFromBottom =
      contentSize.height -
      (contentOffset.y + layoutMeasurement.height);

    setShowScrollButton(distanceFromBottom > 180);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({
      animated: true,
    });
  };

  /* =========================================================
     AÇÕES
  ========================================================= */

  const acaoDestino: Partial<
    Record<
      SuggestedAction,
      keyof RootStackParamList
    >
  > = {
    agendar_consulta: "HealthCalendar",
    atualizar_vacina: "Vaccines",
  };

  const handleQuickAction = (
    action: SuggestedAction,
  ) => {
    const destino = acaoDestino[action];

    if (!destino) return;

    navigation.navigate(destino as never);
  };

  const urgente =
    lastResult?.urgency === "alta" ||
    lastResult?.urgency === "emergencia";

  const destino = lastResult
    ? acaoDestino[lastResult.suggestedAction]
    : undefined;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={0}
    >
      {/* =====================================================
          HEADER PREMIUM
      ====================================================== */}

      <View style={extra.header}>
        <View style={extra.headerTopGlow} />

        <TouchableOpacity
          style={extra.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={Colors.white}
          />
        </TouchableOpacity>

        {/* Avatar animado */}
        <View style={extra.avatarWrapper}>
          <Animated.View
            style={[
              extra.avatarGlow,
              {
                opacity: avatarGlow,
                transform: [
                  {
                    scale: avatarPulse,
                  },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              extra.headerAvatar,
              {
                transform: [
                  {
                    scale: avatarPulse,
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name="paw"
              size={21}
              color={Colors.white}
            />
          </Animated.View>
        </View>

        <View style={extra.headerInfo}>
          <Text style={extra.headerTitle}>
            {pet
              ? `Clyvo · ${pet.name}`
              : "Assistente Clyvo"}
          </Text>

          <View style={extra.onlineWrapper}>
            <View style={extra.onlineDot} />

            <Text style={extra.onlineText}>
              Assistente online
            </Text>
          </View>
        </View>

        {/* Menu rápido */}
        <TouchableOpacity
          style={extra.headerButton}
          onPress={() =>
            setShowQuickActions(
              (current) => !current,
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            extra.headerButton,
            extra.headerDeleteButton,
          ]}
          onPress={handleClearChat}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* =====================================================
          AÇÕES RÁPIDAS
      ====================================================== */}

      {showQuickActions && (
        <View style={extra.quickActionsPanel}>
          <View style={extra.quickActionsHeader}>
            <View>
              <Text style={extra.quickActionsTitle}>
                Ações rápidas
              </Text>

              <Text style={extra.quickActionsSubtitle}>
                Acesse recursos do Clyvo
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setShowQuickActions(false)
              }
            >
              <Ionicons
                name="close"
                size={19}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={extra.quickActionsRow}>
            {ACOES_RAPIDAS.map((acao) => (
              <TouchableOpacity
                key={acao.action}
                style={extra.quickActionCard}
                onPress={() =>
                  handleQuickAction(
                    acao.action,
                  )
                }
                activeOpacity={0.8}
              >
                <View style={extra.quickActionIcon}>
                  <Ionicons
                    name={acao.icon}
                    size={18}
                    color={Colors.accentLight}
                  />
                </View>

                <Text style={extra.quickActionTitle}>
                  {acao.title}
                </Text>

                <Text style={extra.quickActionSubtitle}>
                  {acao.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* =====================================================
          ALERTA DE URGÊNCIA
      ====================================================== */}

      {urgente && lastResult && (
        <View
          style={[
            extra.banner,
            lastResult.urgency ===
            "emergencia"
              ? extra.bannerCritico
              : extra.bannerAlerta,
          ]}
        >
          <View style={extra.bannerIcon}>
            <Ionicons
              name={
                lastResult.urgency ===
                "emergencia"
                  ? "warning"
                  : "alert-circle"
              }
              size={19}
              color={Colors.white}
            />
          </View>

          <View style={extra.bannerContent}>
            <Text style={extra.bannerTitle}>
              {lastResult.urgency ===
              "emergencia"
                ? "Atenção imediata"
                : "Atenção recomendada"}
            </Text>

            <Text style={extra.bannerText}>
              {lastResult.urgency ===
              "emergencia"
                ? "Procure atendimento veterinário agora."
                : "Recomendado avaliar o pet em 24 a 48 horas."}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="rgba(255,255,255,0.75)"
          />
        </View>
      )}

      {/* =====================================================
          CHAT
      ====================================================== */}

      <View style={extra.chatContainer}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.messagesList,
            extra.messagesListPremium,
          ]}
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
                extra.welcomeContainer,
                {
                  opacity: welcomeOpacity,
                  transform: [
                    {
                      scale: welcomeScale,
                    },
                  ],
                },
              ]}
            >
              <View style={extra.welcomeOrb}>
                <View style={extra.welcomeOrbInner}>
                  <Ionicons
                    name="sparkles"
                    size={31}
                    color={Colors.accentLight}
                  />
                </View>

                <View style={extra.orbSmallOne} />
                <View style={extra.orbSmallTwo} />
              </View>

              <Text style={extra.welcomeBadge}>
                CLYVO AI
              </Text>

              <Text style={extra.welcomeTitle}>
                Olá! Eu sou o Clyvo 👋
              </Text>

              <Text style={extra.welcomeSubtitle}>
                Seu assistente inteligente para
                cuidar da saúde{" "}
                {pet
                  ? `de ${pet.name}`
                  : "do seu pet"}
                .
              </Text>

              <View style={extra.welcomeInfo}>
                <View style={extra.infoIcon}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={19}
                    color={
                      Colors.accentLight
                    }
                  />
                </View>

                <View style={extra.infoContent}>
                  <Text style={extra.infoTitle}>
                    Orientação personalizada
                  </Text>

                  <Text style={extra.infoText}>
                    O Clyvo pode analisar as
                    informações disponíveis e
                    ajudar você a entender melhor
                    a situação do seu pet.
                  </Text>
                </View>

                <View style={extra.infoStatus}>
                  <View style={extra.infoStatusDot} />
                </View>
              </View>

              {showSuggestions && (
                <View
                  style={extra.suggestionsContainer}
                >
                  <View
                    style={extra.suggestionsHeader}
                  >
                    <View>
                      <Text
                        style={
                          extra.suggestionsTitle
                        }
                      >
                        Experimente perguntar
                      </Text>

                      <Text
                        style={
                          extra.suggestionsSubtitle
                        }
                      >
                        Toque em uma sugestão
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setShowSuggestions(
                          false,
                        )
                      }
                      style={extra.closeSuggestion}
                    >
                      <Ionicons
                        name="close"
                        size={17}
                        color={
                          Colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  {SUGESTOES.map(
                    (sugestao, index) => (
                      <TouchableOpacity
                        key={sugestao.text}
                        style={[
                          extra.suggestionCard,
                          index === 0 &&
                            extra.suggestionCardHighlight,
                        ]}
                        onPress={() =>
                          handleSend(
                            sugestao.text,
                          )
                        }
                        activeOpacity={0.78}
                      >
                        <View
                          style={
                            extra.suggestionIcon
                          }
                        >
                          <Ionicons
                            name={sugestao.icon}
                            size={18}
                            color={
                              Colors.accentLight
                            }
                          />
                        </View>

                        <Text
                          style={
                            extra.suggestionText
                          }
                        >
                          {sugestao.text}
                        </Text>

                        <View
                          style={
                            extra.suggestionArrow
                          }
                        >
                          <Ionicons
                            name="arrow-up"
                            size={15}
                            color={
                              Colors.accentLight
                            }
                          />
                        </View>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* =================================================
              MENSAGENS
          ================================================== */}

          {messages.map((msg, index) => {
            const isUser =
              msg.role === "user";

            const messageAnimation =
              new Animated.Value(0);

            Animated.timing(
              messageAnimation,
              {
                toValue: 1,
                duration: 350,
                delay: Math.min(index * 30, 180),
                easing: Easing.out(
                  Easing.cubic,
                ),
                useNativeDriver: true,
              },
            ).start();

            return (
              <Animated.View
                key={index}
                style={[
                  extra.messageRow,
                  isUser
                    ? extra.messageRowUser
                    : extra.messageRowAi,
                  {
                    opacity:
                      messageAnimation,
                    transform: [
                      {
                        translateY:
                          messageAnimation.interpolate(
                            {
                              inputRange: [0, 1],
                              outputRange: [
                                12,
                                0,
                              ],
                            },
                          ),
                      },
                    ],
                  },
                ]}
              >
                {!isUser && (
                  <View
                    style={extra.messageAvatar}
                  >
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={Colors.white}
                    />
                  </View>
                )}

                <View
                  style={[
                    extra.messageContent,
                    isUser
                      ? extra.messageContentUser
                      : extra.messageContentAi,
                  ]}
                >
                  <View
                    style={
                      isUser
                        ? extra.userBubble
                        : extra.aiBubble
                    }
                  >
                    <Text
                      style={
                        isUser
                          ? extra.userText
                          : extra.aiText
                      }
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>

                {isUser && (
                  <View
                    style={extra.userAvatar}
                  >
                    <Ionicons
                      name="person"
                      size={14}
                      color={Colors.white}
                    />
                  </View>
                )}
              </Animated.View>
            );
          })}

          {/* =================================================
              CTA
          ================================================== */}

          {destino && !sending && (
            <TouchableOpacity
              style={extra.cta}
              onPress={() =>
                navigation.navigate(
                  destino as never,
                )
              }
              activeOpacity={0.82}
            >
              <View style={extra.ctaIcon}>
                <Ionicons
                  name={
                    lastResult?.suggestedAction ===
                    "atualizar_vacina"
                      ? "medkit-outline"
                      : "calendar-outline"
                  }
                  size={19}
                  color={Colors.accentLight}
                />
              </View>

              <View style={extra.ctaContent}>
                <Text style={extra.ctaEyebrow}>
                  RECOMENDADO PELO CLYVO
                </Text>

                <Text style={extra.ctaTitle}>
                  {lastResult?.suggestedAction ===
                  "atualizar_vacina"
                    ? "Carteira de vacinas"
                    : "Agenda de saúde"}
                </Text>

                <Text
                  style={extra.ctaDescription}
                >
                  Toque para acessar
                </Text>
              </View>

              <View style={extra.ctaArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.white}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* =================================================
              TYPING
          ================================================== */}

          {sending && (
            <View style={extra.typingRow}>
              <View style={extra.messageAvatar}>
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={Colors.white}
                />
              </View>

              <View style={extra.typingBubble}>
                <View
                  style={extra.typingDots}
                >
                  <Animated.View
                    style={[
                      extra.typingDot,
                      {
                        opacity:
                          typingAnimation.interpolate(
                            {
                              inputRange: [
                                0,
                                0.5,
                                1,
                              ],
                              outputRange: [
                                0.35,
                                1,
                                0.35,
                              ],
                            },
                          ),
                      },
                    ]}
                  />

                  <Animated.View
                    style={[
                      extra.typingDot,
                      {
                        opacity:
                          typingAnimation.interpolate(
                            {
                              inputRange: [
                                0,
                                0.5,
                                1,
                              ],
                              outputRange: [
                                1,
                                0.35,
                                1,
                              ],
                            },
                          ),
                      },
                    ]}
                  />

                  <Animated.View
                    style={[
                      extra.typingDot,
                      {
                        opacity:
                          typingAnimation.interpolate(
                            {
                              inputRange: [
                                0,
                                0.5,
                                1,
                              ],
                              outputRange: [
                                0.35,
                                1,
                                0.35,
                              ],
                            },
                          ),
                      },
                    ]}
                  />
                </View>

                <Text style={extra.typingText}>
                  Clyvo está pensando...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* =================================================
            SCROLL BUTTON
        ================================================== */}

        {showScrollButton && (
          <TouchableOpacity
            style={extra.scrollButton}
            onPress={scrollToBottom}
            activeOpacity={0.85}
          >
            <Ionicons
              name="arrow-down"
              size={18}
              color={Colors.white}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* =====================================================
          INPUT PREMIUM
      ====================================================== */}

      <View style={extra.inputBar}>
        <TouchableOpacity
          style={extra.plusButton}
          onPress={() =>
            setShowQuickActions(
              (current) => !current,
            )
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="add"
            size={22}
            color={Colors.accentLight}
          />
        </TouchableOpacity>

        <View style={extra.inputContainer}>
          <TextInput
            style={extra.input}
            placeholder="Pergunte ao Clyvo..."
            placeholderTextColor={
              Colors.textSecondary
            }
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

          <View style={extra.inputFooter}>
            <Text
              style={extra.characterCount}
            >
              {input.length}/1000
            </Text>

            {input.length > 0 && (
              <TouchableOpacity
                onPress={() => setInput("")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={
                    Colors.textSecondary
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            extra.sendButton,
            (!input.trim() || sending) &&
              extra.sendButtonDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
          activeOpacity={0.82}
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color={Colors.white}
            />
          ) : (
            <Ionicons
              name="arrow-up"
              size={21}
              color={Colors.white}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS CLYVO AI PREMIUM
|--------------------------------------------------------------------------
*/

const extra = StyleSheet.create({
  /* =========================================================
     HEADER
  ========================================================= */

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingTop:
      Platform.OS === "ios" ? 52 : 42,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  headerTopGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -50,
    top: -120,
    backgroundColor: "rgba(74,158,255,0.18)",
  },

  headerButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.09)",
  },

  headerDeleteButton: {
    marginLeft: 6,
  },

  avatarWrapper: {
    width: 46,
    height: 46,
    marginLeft: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor:
      "rgba(74,158,255,0.75)",
  },

  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.accentLight,
    borderWidth: 2,
    borderColor:
      "rgba(255,255,255,0.35)",
  },

  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
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
    backgroundColor: "#35D07F",
    marginRight: 6,
  },

  onlineText: {
    color:
      "rgba(255,255,255,0.68)",
    fontSize: 11,
    fontWeight: "500",
  },

  /* =========================================================
     AÇÕES RÁPIDAS
  ========================================================= */

  quickActionsPanel: {
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(0,0,0,0.05)",
  },

  quickActionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  quickActionsTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  quickActionsSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  quickActionCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 16,
    padding: 12,
    backgroundColor:
      "rgba(74,158,255,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.14)",
  },

  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(74,158,255,0.12)",
  },

  quickActionTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },

  quickActionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },

  /* =========================================================
     BANNER
  ========================================================= */

  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  bannerAlerta: {
    backgroundColor: "#A96504",
  },

  bannerCritico: {
    backgroundColor: "#B42318",
  },

  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.14)",
  },

  bannerContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  bannerTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "800",
  },

  bannerText: {
    color:
      "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },

  /* =========================================================
     CHAT
  ========================================================= */

  chatContainer: {
    flex: 1,
    position: "relative",
  },

  messagesListPremium: {
    paddingBottom: 24,
  },

  /* =========================================================
     WELCOME
  ========================================================= */

  welcomeContainer: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 4,
  },

  welcomeOrb: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 13,
  },

  welcomeOrbInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.24)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },

  orbSmallOne: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor:
      Colors.accentLight,
    top: 2,
    right: 18,
  },

  orbSmallTwo: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      Colors.accentLight,
    bottom: 11,
    left: 11,
  },

  welcomeBadge: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 5,
  },

  welcomeTitle: {
    color: Colors.text,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  welcomeSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 340,
  },

  welcomeInfo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 17,
    marginTop: 23,
    padding: 14,
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.10)",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(74,158,255,0.10)",
  },

  infoContent: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },

  infoText: {
    color: Colors.textSecondary,
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
    marginLeft: 8,
  },

  infoStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#35D07F",
  },

  /* =========================================================
     SUGESTÕES
  ========================================================= */

  suggestionsContainer: {
    width: "100%",
    marginTop: 25,
  },

  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  suggestionsTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  suggestionsSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  closeSuggestion: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.035)",
  },

  suggestionCard: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor:
      "rgba(0,0,0,0.04)",
  },

  suggestionCardHighlight: {
    borderColor:
      "rgba(74,158,255,0.20)",
  },

  suggestionIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(74,158,255,0.10)",
  },

  suggestionText: {
    flex: 1,
    color: Colors.text,
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
    backgroundColor:
      "rgba(74,158,255,0.08)",
  },

  /* =========================================================
     MENSAGENS
  ========================================================= */

  messageRow: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 15,
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
    backgroundColor:
      Colors.accentLight,
    marginRight: 8,
    borderWidth: 2,
    borderColor:
      "rgba(255,255,255,0.55)",
  },

  userAvatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.primary,
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

  userBubble: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
    borderBottomRightRadius: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },

  aiBubble: {
    backgroundColor: Colors.card,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor:
      "rgba(0,0,0,0.035)",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },

  userText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 21,
  },

  aiText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
  },

  /* =========================================================
     CTA
  ========================================================= */

  cta: {
    width: "88%",
    alignSelf: "flex-start",
    marginLeft: 36,
    marginBottom: 16,
    padding: 13,
    borderRadius: 17,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.20)",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },

  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(74,158,255,0.10)",
  },

  ctaContent: {
    flex: 1,
    marginLeft: 10,
  },

  ctaEyebrow: {
    color: Colors.accentLight,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  ctaTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },

  ctaDescription: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  ctaArrow: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.accentLight,
  },

  /* =========================================================
     TYPING
  ========================================================= */

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
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor:
      "rgba(0,0,0,0.035)",
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
    backgroundColor:
      Colors.accentLight,
  },

  typingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  },

  /* =========================================================
     SCROLL
  ========================================================= */

  scrollButton: {
    position: "absolute",
    right: 17,
    bottom: 18,
    width: 41,
    height: 41,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.primary,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  /* =========================================================
     INPUT
  ========================================================= */

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom:
      Platform.OS === "ios" ? 20 : 11,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor:
      "rgba(0,0,0,0.05)",
  },

  plusButton: {
    width: 42,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
    backgroundColor:
      "rgba(74,158,255,0.09)",
  },

  inputContainer: {
    flex: 1,
    minHeight: 48,
    maxHeight: 115,
    borderRadius: 17,
    backgroundColor:
      Colors.background,
    paddingHorizontal: 13,
    paddingTop: 8,
    paddingBottom: 5,
    borderWidth: 1,
    borderColor:
      "rgba(0,0,0,0.04)",
  },

  input: {
    color: Colors.text,
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
    color: Colors.textSecondary,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    backgroundColor:
      Colors.primary,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  sendButtonDisabled: {
    backgroundColor: "#CBD3DC",
    elevation: 0,
    shadowOpacity: 0,
  },
});