
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
  Image,
  Share,
  Linking,
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
  const [showQuickActions, setShowQuickActions] =
    useState(false);
  const [showTriage, setShowTriage] =
    useState(false);
  const [likedMessages, setLikedMessages] =
    useState<Record<number, "like" | "dislike">>({});

  const scrollRef = useRef<ScrollView>(null);

  /* =========================================================
     ANIMAÇÕES GLOBAIS
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

  const triageAnimation = useRef(
    new Animated.Value(0),
  ).current;

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

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [messages.length, sending]);

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
            setShowTriage(false);
            setLikedMessages({});

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

    if (!destino) {
      return;
    }

    setShowQuickActions(false);

    navigation.navigate(destino as never);
  };

  /* =========================================================
     TRIAGEM
  ========================================================= */

  const handleTriage = (symptom: string) => {
    setShowTriage(false);
    setShowSuggestions(false);

    handleSend(
      `Quero fazer uma triagem. O meu pet está com ${symptom}.`,
    );
  };

  /* =========================================================
     FEEDBACK
  ========================================================= */

  const handleFeedback = (
    index: number,
    value: "like" | "dislike",
  ) => {
    setLikedMessages((current) => ({
      ...current,
      [index]: value,
    }));
  };

  /* =========================================================
     COMPARTILHAR
  ========================================================= */

  const handleShare = async (text: string) => {
    try {
      await Share.share({
        message: text,
      });
    } catch {
      // Não interrompe o funcionamento do chat
    }
  };

  /* =========================================================
     TRIAGEM / URGÊNCIA
  ========================================================= */

  const urgente =
    lastResult?.urgency === "alta" ||
    lastResult?.urgency === "emergencia";

  const emergencia =
    lastResult?.urgency === "emergencia";

  const destino = lastResult
    ? acaoDestino[lastResult.suggestedAction]
    : undefined;

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
      style={styles.safe}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={0}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <View style={extra.header}>
        <View style={extra.headerGlowOne} />
        <View style={extra.headerGlowTwo} />

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
            {petImage ? (
              <Image
                source={{
                  uri: petImage,
                }}
                style={extra.petImage}
              />
            ) : (
              <Ionicons
                name="paw"
                size={21}
                color={Colors.white}
              />
            )}

            <View style={extra.headerOnlineDot} />
          </Animated.View>
        </View>

        <View style={extra.headerInfo}>
          <View style={extra.headerNameRow}>
            <Text style={extra.headerTitle}>
              {pet
                ? pet.name
                : "Assistente Clyvo"}
            </Text>

            <View style={extra.aiBadge}>
              <Ionicons
                name="sparkles"
                size={10}
                color={Colors.white}
              />

              <Text style={extra.aiBadgeText}>
                AI
              </Text>
            </View>
          </View>

          <View style={extra.onlineWrapper}>
            <View style={extra.onlineDot} />

            <Text style={extra.onlineText}>
              Clyvo online
            </Text>
          </View>
        </View>

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
                Central do Clyvo
              </Text>

              <Text
                style={
                  extra.quickActionsSubtitle
                }
              >
                Ferramentas rápidas para cuidar do
                seu pet
              </Text>
            </View>

            <TouchableOpacity
              style={extra.panelCloseButton}
              onPress={() =>
                setShowQuickActions(false)
              }
            >
              <Ionicons
                name="close"
                size={18}
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
                activeOpacity={0.82}
              >
                <View
                  style={extra.quickActionIcon}
                >
                  <Ionicons
                    name={acao.icon}
                    size={19}
                    color={Colors.accentLight}
                  />
                </View>

                <Text
                  style={
                    extra.quickActionTitle
                  }
                >
                  {acao.title}
                </Text>

                <Text
                  style={
                    extra.quickActionSubtitle
                  }
                >
                  {acao.subtitle}
                </Text>

                <Ionicons
                  name="arrow-up-right"
                  size={15}
                  color={Colors.accentLight}
                  style={
                    extra.quickActionArrow
                  }
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                extra.quickActionCard,
                extra.triageActionCard,
              ]}
              onPress={() =>
                setShowTriage(true)
              }
              activeOpacity={0.82}
            >
              <View
                style={extra.quickActionIcon}
              >
                <Ionicons
                  name="pulse-outline"
                  size={19}
                  color={Colors.accentLight}
                />
              </View>

              <Text
                style={extra.quickActionTitle}
              >
                Triagem
              </Text>

              <Text
                style={
                  extra.quickActionSubtitle
                }
              >
                Iniciar
              </Text>

              <Ionicons
                name="arrow-up-right"
                size={15}
                color={Colors.accentLight}
                style={
                  extra.quickActionArrow
                }
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
            extra.triagePanel,
            {
              opacity: triageAnimation,
              transform: [
                {
                  translateY:
                    triageAnimation.interpolate(
                      {
                        inputRange: [0, 1],
                        outputRange: [
                          -15,
                          0,
                        ],
                      },
                    ),
                },
              ],
            },
          ]}
        >
          <View style={extra.triageHeader}>
            <View>
              <View
                style={extra.triageTitleRow}
              >
                <View
                  style={extra.triagePulse}
                >
                  <Ionicons
                    name="pulse"
                    size={17}
                    color={Colors.white}
                  />
                </View>

                <Text
                  style={extra.triageTitle}
                >
                  Modo Triagem
                </Text>
              </View>

              <Text
                style={extra.triageSubtitle}
              >
                O que está acontecendo com o pet?
              </Text>
            </View>

            <TouchableOpacity
              style={extra.panelCloseButton}
              onPress={() =>
                setShowTriage(false)
              }
            >
              <Ionicons
                name="close"
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={extra.triageGrid}>
            <TouchableOpacity
              style={extra.triageItem}
              onPress={() =>
                handleTriage("vomitando")
              }
            >
              <Text
                style={extra.triageEmoji}
              >
                🤢
              </Text>

              <Text
                style={extra.triageItemText}
              >
                Vômito
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={extra.triageItem}
              onPress={() =>
                handleTriage(
                  "com diarreia",
                )
              }
            >
              <Text
                style={extra.triageEmoji}
              >
                💧
              </Text>

              <Text
                style={extra.triageItemText}
              >
                Diarreia
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={extra.triageItem}
              onPress={() =>
                handleTriage(
                  "sem querer comer",
                )
              }
            >
              <Text
                style={extra.triageEmoji}
              >
                🍖
              </Text>

              <Text
                style={extra.triageItemText}
              >
                Apetite
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={extra.triageItem}
              onPress={() =>
                handleTriage("com dor")
              }
            >
              <Text
                style={extra.triageEmoji}
              >
                🩹
              </Text>

              <Text
                style={extra.triageItemText}
              >
                Dor
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* =====================================================
          URGÊNCIA
      ====================================================== */}

      {urgente && lastResult && (
        <View
          style={[
            extra.banner,
            emergencia
              ? extra.bannerCritico
              : extra.bannerAlerta,
          ]}
        >
          <View style={extra.bannerIcon}>
            <Ionicons
              name={
                emergencia
                  ? "warning"
                  : "alert-circle"
              }
              size={19}
              color={Colors.white}
            />
          </View>

          <View style={extra.bannerContent}>
            <Text
              style={extra.bannerTitle}
            >
              {emergencia
                ? "Atenção imediata"
                : "Atenção recomendada"}
            </Text>

            <Text style={extra.bannerText}>
              {emergencia
                ? "O relato pode indicar uma situação que exige atendimento veterinário imediato."
                : "Pode ser importante avaliar o pet nas próximas 24 a 48 horas."}
            </Text>
          </View>

          <TouchableOpacity
            style={extra.bannerAction}
            onPress={() => {
              Alert.alert(
                "Atendimento veterinário",
                "Procure uma clínica veterinária de confiança ou serviço de emergência da sua região.",
                [
                  {
                    text: "OK",
                    style: "default",
                  },
                ],
              );
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={Colors.white}
            />
          </TouchableOpacity>
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
              <View style={extra.heroArea}>
                <View style={extra.heroOrbitOne} />
                <View style={extra.heroOrbitTwo} />

                <View style={extra.heroAvatar}>
                  {petImage ? (
                    <Image
                      source={{
                        uri: petImage,
                      }}
                      style={extra.heroPetImage}
                    />
                  ) : (
                    <Ionicons
                      name="sparkles"
                      size={34}
                      color={
                        Colors.accentLight
                      }
                    />
                  )}
                </View>

                <View
                  style={extra.heroSparkle}
                >
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color={Colors.white}
                  />
                </View>

                <View style={extra.heroOnline}>
                  <View
                    style={extra.heroOnlineDot}
                  />

                  <Text
                    style={
                      extra.heroOnlineText
                    }
                  >
                    ONLINE
                  </Text>
                </View>
              </View>

              <Text style={extra.welcomeBadge}>
                CLYVO AI
              </Text>

              <Text style={extra.welcomeTitle}>
                Olá! Eu sou o Clyvo 👋
              </Text>

              <Text
                style={extra.welcomeSubtitle}
              >
                Seu assistente inteligente para
                cuidar da saúde{" "}
                {pet
                  ? `de ${pet.name}`
                  : "do seu pet"}{" "}
                com mais praticidade.
              </Text>

              <View style={extra.trustRow}>
                <View style={extra.trustItem}>
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color="#35D07F"
                  />

                  <Text
                    style={
                      extra.trustText
                    }
                  >
                    Histórico
                  </Text>
                </View>

                <View style={extra.trustDivider} />

                <View style={extra.trustItem}>
                  <Ionicons
                    name="flash"
                    size={13}
                    color={
                      Colors.accentLight
                    }
                  />

                  <Text
                    style={
                      extra.trustText
                    }
                  >
                    Respostas rápidas
                  </Text>
                </View>

                <View style={extra.trustDivider} />

                <View style={extra.trustItem}>
                  <Ionicons
                    name="paw"
                    size={13}
                    color={
                      Colors.accentLight
                    }
                  />

                  <Text
                    style={
                      extra.trustText
                    }
                  >
                    Pet care
                  </Text>
                </View>
              </View>

              <View style={extra.welcomeInfo}>
                <View style={extra.infoIcon}>
                  <Ionicons
                    name="sparkles-outline"
                    size={19}
                    color={
                      Colors.accentLight
                    }
                  />
                </View>

                <View
                  style={extra.infoContent}
                >
                  <Text
                    style={extra.infoTitle}
                  >
                    Assistência inteligente
                  </Text>

                  <Text
                    style={extra.infoText}
                  >
                    O Clyvo usa as informações
                    disponíveis do seu pet como
                    contexto da conversa.
                  </Text>
                </View>

                <View style={extra.infoStatus}>
                  <View
                    style={extra.infoStatusDot}
                  />
                </View>
              </View>

              {/* TRIAGEM INICIAL */}
              <TouchableOpacity
                style={extra.triageLaunch}
                onPress={() =>
                  setShowTriage(true)
                }
                activeOpacity={0.82}
              >
                <View
                  style={extra.triageLaunchIcon}
                >
                  <Ionicons
                    name="pulse"
                    size={20}
                    color={Colors.white}
                  />
                </View>

                <View
                  style={extra.triageLaunchContent}
                >
                  <Text
                    style={
                      extra.triageLaunchTitle
                    }
                  >
                    Iniciar uma triagem
                  </Text>

                  <Text
                    style={
                      extra.triageLaunchText
                    }
                  >
                    Vamos entender os sintomas
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.white}
                />
              </TouchableOpacity>

              {/* SUGESTÕES */}
              {showSuggestions && (
                <View
                  style={
                    extra.suggestionsContainer
                  }
                >
                  <View
                    style={
                      extra.suggestionsHeader
                    }
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
                        Perguntas rápidas para começar
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setShowSuggestions(
                          false,
                        )
                      }
                      style={
                        extra.closeSuggestion
                      }
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
                    (
                      sugestao,
                      index,
                    ) => (
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
                            name={
                              sugestao.icon
                            }
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

            return (
              <View
                key={index}
                style={[
                  extra.messageRow,
                  isUser
                    ? extra.messageRowUser
                    : extra.messageRowAi,
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
                    style={[
                      extra.messageLabelRow,
                      isUser &&
                        extra.messageLabelRowUser,
                    ]}
                  >
                    {!isUser && (
                      <Text
                        style={
                          extra.messageLabel
                        }
                      >
                        Clyvo AI
                      </Text>
                    )}

                    {isUser && (
                      <Text
                        style={
                          extra.messageLabelUser
                        }
                      >
                        Você
                      </Text>
                    )}
                  </View>

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

                  {/* AÇÕES DA RESPOSTA */}
                  {!isUser && (
                    <View
                      style={
                        extra.messageActions
                      }
                    >
                      <TouchableOpacity
                        style={
                          extra.messageAction
                        }
                        onPress={() =>
                          handleFeedback(
                            index,
                            "like",
                          )
                        }
                      >
                        <Ionicons
                          name={
                            likedMessages[
                              index
                            ] === "like"
                              ? "thumbs-up"
                              : "thumbs-up-outline"
                          }
                          size={14}
                          color={
                            likedMessages[
                              index
                            ] === "like"
                              ? Colors.accentLight
                              : Colors.textSecondary
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          extra.messageAction
                        }
                        onPress={() =>
                          handleFeedback(
                            index,
                            "dislike",
                          )
                        }
                      >
                        <Ionicons
                          name={
                            likedMessages[
                              index
                            ] === "dislike"
                              ? "thumbs-down"
                              : "thumbs-down-outline"
                          }
                          size={14}
                          color={
                            likedMessages[
                              index
                            ] === "dislike"
                              ? Colors.accentLight
                              : Colors.textSecondary
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          extra.messageAction
                        }
                        onPress={() =>
                          handleShare(
                            msg.content,
                          )
                        }
                      >
                        <Ionicons
                          name="share-outline"
                          size={14}
                          color={
                            Colors.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )}
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
              </View>
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
                <Text
                  style={extra.ctaEyebrow}
                >
                  RECOMENDADO PELO CLYVO
                </Text>

                <Text style={extra.ctaTitle}>
                  {lastResult?.suggestedAction ===
                  "atualizar_vacina"
                    ? "Carteira de vacinas"
                    : "Agenda de saúde"}
                </Text>

                <Text
                  style={
                    extra.ctaDescription
                  }
                >
                  Acesse diretamente este recurso
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
              LOADING
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

              <View
                style={extra.typingBubble}
              >
                <View style={extra.typingDots}>
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

                <Text
                  style={extra.typingText}
                >
                  Clyvo está analisando...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* =================================================
            BOTÃO DE VOLTAR
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
          INPUT
      ====================================================== */}

      <View style={extra.inputBar}>
        <TouchableOpacity
          style={extra.plusButton}
          onPress={() =>
            setShowQuickActions(
              (current) => !current,
            )
          }
          activeOpacity={0.82}
        >
          <Ionicons
            name={
              showQuickActions
                ? "close"
                : "add"
            }
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
| CLYVO AI ULTRA
|--------------------------------------------------------------------------
*/

const extra = StyleSheet.create({
  /* =========================================================
     HEADER
  ========================================================= */

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 13,
    paddingTop:
      Platform.OS === "ios" ? 52 : 42,
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
    backgroundColor:
      "rgba(74,158,255,0.18)",
  },

  headerGlowTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    left: -75,
    top: -100,
    backgroundColor:
      "rgba(74,158,255,0.08)",
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
    backgroundColor: "#35D07F",
    borderWidth: 2,
    borderColor: Colors.primary,
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
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },

  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor:
      "rgba(255,255,255,0.13)",
  },

  aiBadgeText: {
    color: Colors.white,
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
     ACTIONS
  ========================================================= */

  quickActionsPanel: {
    backgroundColor: Colors.card,
    paddingHorizontal: 13,
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
    marginTop: 3,
  },

  panelCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.035)",
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
    backgroundColor:
      "rgba(74,158,255,0.065)",
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.14)",
    position: "relative",
  },

  triageActionCard: {
    backgroundColor:
      "rgba(74,158,255,0.095)",
  },

  quickActionIcon: {
    width: 33,
    height: 33,
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

  quickActionArrow: {
    position: "absolute",
    right: 9,
    top: 10,
  },

  /* =========================================================
     TRIAGEM
  ========================================================= */

  triagePanel: {
    backgroundColor: Colors.card,
    paddingHorizontal: 13,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(0,0,0,0.05)",
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
    backgroundColor:
      Colors.accentLight,
  },

  triageTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },

  triageSubtitle: {
    color: Colors.textSecondary,
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
    backgroundColor:
      "rgba(74,158,255,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.12)",
  },

  triageEmoji: {
    fontSize: 21,
  },

  triageItemText: {
    color: Colors.text,
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
    backgroundColor: Colors.primary,
  },

  triageLaunchIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.12)",
  },

  triageLaunchContent: {
    flex: 1,
    marginLeft: 10,
  },

  triageLaunchTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "800",
  },

  triageLaunchText: {
    color:
      "rgba(255,255,255,0.68)",
    fontSize: 10,
    marginTop: 2,
  },

  /* =========================================================
     ALERTA
  ========================================================= */

  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  bannerAlerta: {
    backgroundColor: "#A96504",
  },

  bannerCritico: {
    backgroundColor: "#B42318",
  },

  bannerIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
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
      "rgba(255,255,255,0.84)",
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
    backgroundColor:
      "rgba(255,255,255,0.10)",
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
     HERO
  ========================================================= */

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
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.24)",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
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
    borderColor:
      "rgba(74,158,255,0.15)",
  },

  heroOrbitTwo: {
    position: "absolute",
    width: 123,
    height: 123,
    borderRadius: 62,
    borderWidth: 1,
    borderColor:
      "rgba(74,158,255,0.08)",
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
    backgroundColor:
      Colors.accentLight,
    borderWidth: 2,
    borderColor: Colors.card,
  },

  heroOnline: {
    position: "absolute",
    bottom: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.card,
  },

  heroOnlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#35D07F",
    marginRight: 4,
  },

  heroOnlineText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  welcomeBadge: {
    color: Colors.accentLight,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 6,
  },

  welcomeTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  welcomeSubtitle: {
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "600",
    marginLeft: 4,
  },

  trustDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor:
      Colors.textSecondary,
    opacity: 0.35,
    marginHorizontal: 9,
  },

  /* =========================================================
     INFO
  ========================================================= */

  welcomeInfo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 17,
    marginTop: 21,
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
    marginLeft: 7,
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
    marginTop: 24,
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
    fontSize: 10,
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

  messageLabelRow: {
    marginLeft: 2,
    marginBottom: 4,
  },

  messageLabelRowUser: {
    alignItems: "flex-end",
  },

  messageLabel: {
    color: Colors.accentLight,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  messageLabelUser: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
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
    fontSize: 10,
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
     DIGITANDO
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
    right: 16,
    bottom: 17,
    width: 42,
    height: 42,
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
    paddingHorizontal: 10,
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