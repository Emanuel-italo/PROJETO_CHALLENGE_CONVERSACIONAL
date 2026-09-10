// PetChatScreen.tsx
//
// Tela de chat do Clyvo — versão responsiva.
//
// Dependências existentes:
//   src/styles/theme.ts
//   src/components/RichText.tsx
//   react-native-safe-area-context  (já vem no Expo + React Navigation)
//
// O que mudou em relação à versão anterior:
//   • Escala fluida de tipografia e espaçamento (useResponsive)
//   • Safe area real via insets, sem Platform.OS hardcoded
//   • Sidebar permanente em tablet/desktop, overlay em celular
//   • FlatList com itens memoizados no lugar do ScrollView
//   • Alvos de toque com mínimo de 44px e labels de acessibilidade
//   • Respeita "reduzir movimento" do sistema
//   • Coluna de leitura com largura máxima (conforto de leitura)

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";

import {
  useSafeAreaInsets,
  type EdgeInsets,
} from "react-native-safe-area-context";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { Pet, RootStackParamList } from "../../types";
import { usePets } from "../../hooks/usePets";
import { useAiChat } from "../../hooks/useAiChat";
import { usePetRisk } from "../../hooks/usePetRisk";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { useSpeechOutput } from "../../hooks/useSpeechOutput";
import { useBreedPhoto } from "../../hooks/useBreedPhoto";
import { useImagePicker } from "../../hooks/useImagePicker";
import { useMockColar } from "../../hooks/useMockColar";
import { ChatResult, SuggestedAction } from "../../services/AiService";
import { DarkColors, LightColors, Theme, useTheme } from "../../styles/theme";
import RichText from "../../components/RichText";
import { showAlert } from "../../utils/showAlert";

/* ============================================================
   TIPOS
============================================================ */

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AiAlert = ChatResult["alerts"][number];
type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Feedback = Record<number, "like" | "dislike">;

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  audioUri?: string;
  audioDuration?: number;
  timestamp?: number;
  imageUri?: string;
};

/** Métricas calculadas uma vez por mudança de viewport. */
type Metrics = {
  width: number;
  height: number;
  /** < 360dp — iPhone SE, Galaxy A0x */
  isCompact: boolean;
  /** >= 720dp — tablets em pé */
  isTablet: boolean;
  /** >= 1080dp — tablets deitados, web */
  isWide: boolean;
  /** >= 1300dp em paisagem — espaço de sobra para um 3º painel */
  isDesktop: boolean;
  /** altura pequena: teclado aberto em telas curtas */
  isShort: boolean;
  isLandscape: boolean;
  /** 'permanent' mantém a sidebar sempre visível ao lado do chat */
  sidebarMode: "overlay" | "permanent";
  /** largura da coluna de leitura */
  contentMaxWidth: number;
  /** largura máxima de um balão de mensagem */
  bubbleMaxWidth: number;
  drawerWidth: number;
  /** > 0 quando há espaço para o painel fixo de números do pet */
  statsPanelWidth: number;
  gutter: number;
  /** colunas do grid de triagem */
  triageColumns: number;
  insets: EdgeInsets;
  /** escala de fonte */
  fs: (n: number) => number;
  /** escala de espaçamento */
  sp: (n: number) => number;
};

/* ============================================================
   CONTEÚDO
============================================================ */

const SUGESTOES: { icon: IconName; text: string }[] = [
  { icon: "medkit-outline", text: "A vacina dela está em dia?" },
  { icon: "restaurant-outline", text: "Ele está comendo menos hoje" },
  { icon: "calendar-outline", text: "Quando é o próximo check-up?" },
];

const ACOES_RAPIDAS: {
  icon: IconName;
  title: string;
  subtitle: string;
  action: SuggestedAction;
}[] = [
  {
    icon: "medkit-outline",
    title: "Vacinas",
    subtitle: "Ver carteira",
    action: "atualizar_vacina" as SuggestedAction,
  },
  {
    icon: "calendar-outline",
    title: "Consulta",
    subtitle: "Agendar",
    action: "agendar_consulta" as SuggestedAction,
  },
];

const SINTOMAS: { icon: IconName; label: string; termo: string }[] = [
  { icon: "sad-outline", label: "Vômito", termo: "vomitando" },
  { icon: "water-outline", label: "Diarreia", termo: "com diarreia" },
  { icon: "restaurant-outline", label: "Apetite", termo: "sem querer comer" },
  { icon: "body-outline", label: "Dor", termo: "com dor" },
];

const LIMITE_CARACTERES = 1000;

/** Multiplicadores fixos pra dar variação natural às barras de nível de
 * voz — todas sobem/descem juntas com o volume real, só a proporção varia. */
const NIVEL_MULTIPLICADORES = [0.5, 0.85, 1, 0.6, 0.9, 0.7, 1, 0.55, 0.8, 0.65];

/** HH:mm do horário de envio — sem depender de Intl (nem sempre disponível
 * de forma completa no engine JS do RN). */
function formatarHorarioMensagem(timestamp?: number): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/** mm:ss a partir de segundos (arredonda, nunca fica negativo). */
function formatarTempoAudio(segundos: number): string {
  const total = Math.max(0, Math.round(segundos || 0));
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

/**
 * "Forma de onda" fake, porém estável: mesma URI sempre gera as mesmas
 * barras (não é a onda real do áudio — analisar o PCM custaria caro à
 * toa aqui —, mas dá a sensação visual de uma mensagem de voz do WhatsApp).
 */
function gerarBarrasOnda(semente: string, quantidade = 26): number[] {
  let h = 0;
  for (let i = 0; i < semente.length; i++) {
    h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  }
  let x = h || 1;
  const barras: number[] = [];
  for (let i = 0; i < quantidade; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    barras.push(0.3 + ((x % 1000) / 1000) * 0.7);
  }
  return barras;
}

/* ============================================================
   HOOKS DE APOIO
============================================================ */

/**
 * Traduz o viewport atual em métricas de layout.
 * Toda decisão responsiva da tela sai daqui — nada de número mágico
 * espalhado pelos estilos.
 */
function useResponsive(): Metrics {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo<Metrics>(() => {
    const isCompact = width < 360;
    const isTablet = width >= 720;
    const isWide = width >= 1080;
    const isShort = height < 680;
    const isLandscape = width > height;
    const isDesktop = width >= 1300 && isLandscape;

    // Fator de escala tipográfica. Cresce devagar: texto de tablet
    // grande demais fica infantil, e o objetivo é conforto de leitura.
    const typeFactor = isWide ? 1.14 : isTablet ? 1.07 : isCompact ? 0.93 : 1;

    // Espaçamento cresce mais que a fonte: telas grandes pedem ar,
    // telas pequenas pedem densidade.
    const spaceFactor = isWide ? 1.3 : isTablet ? 1.18 : isCompact ? 0.86 : 1;

    const fs = (n: number) => Math.round(n * typeFactor);
    const sp = (n: number) => Math.round(n * spaceFactor);

    const sidebarMode: Metrics["sidebarMode"] =
      isTablet && isLandscape ? "permanent" : "overlay";

    const drawerWidth =
      sidebarMode === "permanent"
        ? Math.min(320, width * 0.28)
        : Math.min(340, width * 0.86);

    // Painel fixo de números do pet: só cabe quando sobra espaço depois
    // da sidebar + coluna de leitura confortável.
    const statsPanelWidth = isDesktop ? Math.min(300, width * 0.19) : 0;

    // Largura da área de chat depois de descontar a sidebar fixa e o painel.
    const chatWidth =
      (sidebarMode === "permanent" ? width - drawerWidth : width) -
      statsPanelWidth;

    // Linha de leitura confortável fica abaixo de ~72 caracteres.
    const contentMaxWidth = Math.min(chatWidth, isWide ? 860 : 760);

    const gutter = sp(isTablet ? 20 : 14);

    // Em telas largas o balão para de crescer em % e passa a ter teto
    // absoluto, senão a linha fica longa demais para ler.
    const bubbleMaxWidth = isTablet
      ? Math.min(620, (contentMaxWidth - gutter * 2) * 0.82)
      : (Math.min(chatWidth, contentMaxWidth) - gutter * 2) * 0.86;

    return {
      width,
      height,
      isCompact,
      isTablet,
      isWide,
      isDesktop,
      isShort,
      isLandscape,
      sidebarMode,
      contentMaxWidth,
      bubbleMaxWidth,
      drawerWidth,
      statsPanelWidth,
      gutter,
      triageColumns: isTablet ? 4 : 2,
      insets,
      fs,
      sp,
    };
  }, [width, height, insets]);
}

/** Respeita a preferência de "reduzir movimento" do sistema. */
function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let vivo = true;

    AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (vivo) setReduce(valor);
    });

    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );

    return () => {
      vivo = false;
      sub?.remove();
    };
  }, []);

  return reduce;
}

/* ============================================================
   SUBCOMPONENTES MEMOIZADOS
============================================================ */

type Estilos = ReturnType<typeof makeStyles>;

/**
 * Entrada animada de uma mensagem. Anima só na montagem — mensagens
 * antigas ficam paradas enquanto novas chegam.
 */
const Entrada = memo(function Entrada({
  children,
  disabled,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  disabled: boolean;
  delay?: number;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(disabled ? 1 : 0)).current;

  useEffect(() => {
    if (disabled) return;
    Animated.spring(anim, {
      toValue: 1,
      tension: 60,
      friction: 9,
      delay,
      useNativeDriver: true,
    }).start();
  }, [disabled, delay, anim]);

  if (disabled) return <View style={style}>{children}</View>;

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});

/**
 * Encolhe levemente no toque e volta com uma mola — dá feedback tátil
 * a cartões e botões sem precisar reimplementar o gesto em cada lugar.
 */
const Toque = memo(function Toque({
  children,
  onPress,
  style,
  contentStyle,
  disabled,
  reduceMotion,
  accessibilityLabel,
  accessibilityRole = "button",
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  /** Estilo do container que envolve `children` de fato (onde flexDirection
   * de fato importa) — `style` fica só no Pressable externo, que cuida do
   * tamanho/fundo, mas não é o pai direto dos filhos. */
  contentStyle?: any;
  disabled?: boolean;
  reduceMotion: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: "button";
}) {
  const escala = useRef(new Animated.Value(1)).current;

  const aoPressionar = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(escala, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }, [escala, reduceMotion]);

  const aoSoltar = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 9,
    }).start();
  }, [escala, reduceMotion]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <Animated.View style={[contentStyle, { transform: [{ scale: escala }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

/**
 * Imagem que surge com um fade suave quando termina de carregar, em vez
 * de aparecer de uma vez (mais notável nas fotos de raça vindas da rede).
 */
const FotoComFade = memo(function FotoComFade({
  uri,
  style,
  reduceMotion,
}: {
  uri: string;
  style: any;
  reduceMotion: boolean;
}) {
  const opacidade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  return (
    <Animated.Image
      source={{ uri }}
      style={[style, { opacity: opacidade }]}
      onLoad={() => {
        if (reduceMotion) return;
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }).start();
      }}
    />
  );
});

/**
 * Miniatura do pet na lista do menu: foto própria se houver, senão uma
 * foto real da raça (busca sob demanda), com ícone de pata como último
 * recurso.
 */
/**
 * Coração que pulsa no ritmo real do BPM simulado (batida a batida, não
 * um loop genérico) — quanto maior o BPM, mais rápido pulsa.
 */
const BatimentoIcon = memo(function BatimentoIcon({
  bpm,
  cor,
  reduceMotion,
}: {
  bpm: number;
  cor: string;
  reduceMotion: boolean;
}) {
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) return;

    const duracaoBatida = 60000 / Math.max(30, bpm) / 2;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.28,
          duration: duracaoBatida,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(escala, {
          toValue: 1,
          duration: duracaoBatida,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bpm, reduceMotion, escala]);

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Ionicons name="heart" size={20} color={cor} />
    </Animated.View>
  );
});

/** Termômetro com um brilho suave "respirando" — só pra dar sensação de
 * leitura ao vivo, sem ser tão chamativo quanto o batimento. */
const TermometroIcon = memo(function TermometroIcon({
  cor,
  reduceMotion,
}: {
  cor: string;
  reduceMotion: boolean;
}) {
  const opacidade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, {
          toValue: 0.5,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, opacidade]);

  return (
    <Animated.View style={{ opacity: opacidade }}>
      <Ionicons name="thermometer" size={20} color={cor} />
    </Animated.View>
  );
});

const DrawerPetAvatar = memo(function DrawerPetAvatar({
  pet,
  s,
  cor,
  reduceMotion,
}: {
  pet: Pet;
  s: Estilos;
  cor: string;
  reduceMotion: boolean;
}) {
  const fotoRaca = useBreedPhoto(pet);

  const foto =
    (pet as any)?.imageUri ??
    (pet as any)?.photoUri ??
    (pet as any)?.image ??
    (pet as any)?.photo ??
    fotoRaca ??
    null;

  return (
    <View style={s.drawerPetThumbBox}>
      {foto ? (
        <FotoComFade uri={foto} style={s.drawerPetThumb} reduceMotion={reduceMotion} />
      ) : (
        <Ionicons name="paw-outline" size={18} color={cor} />
      )}
    </View>
  );
});

/**
 * Balão de mensagem de voz, no estilo "nota de voz" do WhatsApp: botão
 * de play/pausa, barrinhas de onda (visuais, não a onda real) e duração.
 */
const AudioMessageBubble = memo(function AudioMessageBubble({
  uri,
  duracaoAproximada,
  s,
  variante = "user",
  corAccent,
  horario,
  lida,
}: {
  uri: string;
  duracaoAproximada: number;
  s: Estilos;
  /** "user" = balão escuro (elementos claros); "assistant" = balão claro
   * do cartão de IA (elementos na cor de destaque do tema). */
  variante?: "user" | "assistant";
  /** Cor de destaque usada na variante "assistant" (padrão: azul do tema). */
  corAccent?: string;
  /** HH:mm do envio, exibido tipo WhatsApp. */
  horario?: string;
  /** Só relevante pra variante "user": mostra ✓✓ quando a IA já respondeu. */
  lida?: boolean;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const duracaoTotal =
    status.duration > 0 ? status.duration : duracaoAproximada;
  const progresso =
    duracaoTotal > 0 ? Math.min(1, status.currentTime / duracaoTotal) : 0;

  const barras = useMemo(() => gerarBarrasOnda(uri), [uri]);

  const alternar = useCallback(() => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || status.currentTime >= duracaoTotal - 0.05) {
      player.seekTo(0);
    }
    player.play();
  }, [player, status.playing, status.didJustFinish, status.currentTime, duracaoTotal]);

  const semAudio = !status.isLoaded && status.duration === 0 && !status.playing;

  const tempoExibido = formatarTempoAudio(
    status.playing || status.currentTime > 0 ? status.currentTime : duracaoTotal,
  );

  const ehAssistente = variante === "assistant";
  const cor = corAccent ?? "#4A9EFF";

  return (
    <View style={s.audioBubbleWrap}>
      <View style={s.audioBubble}>
        <Pressable
          onPress={alternar}
          style={[
            s.audioBubbleBotao,
            ehAssistente && { backgroundColor: cor },
          ]}
          accessibilityRole="button"
          accessibilityLabel={status.playing ? "Pausar áudio" : "Reproduzir áudio"}
        >
          <Ionicons name={status.playing ? "pause" : "play"} size={15} color="#FFF" />
        </Pressable>

        <View style={s.audioBubbleOnda}>
          {barras.map((altura, i) => (
            <View
              key={i}
              style={[
                s.audioBubbleBarra,
                {
                  height: 3 + altura * 13,
                  backgroundColor: ehAssistente
                    ? i / barras.length <= progresso
                      ? cor
                      : `${cor}33`
                    : i / barras.length <= progresso
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.32)",
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={s.audioBubbleRodape}>
        <Text style={[s.audioBubbleTempo, ehAssistente && { color: cor }]}>
          {semAudio ? "áudio" : tempoExibido}
        </Text>

        {!!horario && (
          <View style={s.audioBubbleStatus}>
            <Text
              style={ehAssistente ? s.audioBubbleHorarioAi : s.audioBubbleHorario}
            >
              {horario}
            </Text>
            {!ehAssistente && (
              <Ionicons
                name={lida ? "checkmark-done" : "checkmark"}
                size={13}
                color={lida ? "#53BDEB" : "rgba(255,255,255,0.75)"}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
});

/**
 * Um balão de mensagem. Memoizado para que o streaming da última
 * mensagem não force o re-render de todo o histórico.
 */
const Bolha = memo(
  function Bolha({
    msg,
    index,
    s,
    theme,
    texto,
    mostrarCursor,
    tagUrgencia,
    feedback,
    onFeedback,
    onShare,
    semAnimacao,
    respondida,
    aoAbrirImagem,
  }: {
    msg: ChatMessage;
    index: number;
    s: Estilos;
    theme: Theme;
    texto: string;
    mostrarCursor: boolean;
    tagUrgencia: { cor: string; rotulo: string; icone: IconName } | null;
    feedback?: "like" | "dislike";
    onFeedback: (index: number, valor: "like" | "dislike") => void;
    onShare: (texto: string) => void;
    semAnimacao: boolean;
    /** Só pra mensagens do usuário: já veio resposta da IA depois dela? */
    respondida: boolean;
    aoAbrirImagem: (uri: string) => void;
  }) {
    const c = theme.colors;
    const isUser = msg.role === "user";
    const [mostrarTexto, setMostrarTexto] = useState(false);
    const horario = formatarHorarioMensagem(msg.timestamp);

    return (
      <Entrada disabled={semAnimacao}>
        <View style={[s.messageRow, isUser ? s.messageRowUser : s.messageRowAi]}>
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
            <Text style={isUser ? s.messageLabelUser : s.messageLabel}>
              {isUser ? "Você" : "Clyvo"}
            </Text>

            <View style={isUser ? s.userBubble : s.aiBubble}>
              {isUser ? (
                msg.audioUri ? (
                  <AudioMessageBubble
                    uri={msg.audioUri}
                    duracaoAproximada={msg.audioDuration ?? 0}
                    s={s}
                    horario={horario}
                    lida={respondida}
                  />
                ) : msg.imageUri ? (
                  <Pressable onPress={() => aoAbrirImagem(msg.imageUri!)}>
                    <FotoComFade
                      uri={msg.imageUri}
                      style={s.mensagemFotoThumb}
                      reduceMotion={semAnimacao}
                    />
                    <View style={s.mensagemStatusRow}>
                      <Text style={s.mensagemHorario}>{horario}</Text>
                      <Ionicons
                        name={respondida ? "checkmark-done" : "checkmark"}
                        size={13}
                        color={respondida ? "#53BDEB" : "rgba(255,255,255,0.75)"}
                      />
                    </View>
                  </Pressable>
                ) : (
                  <>
                    <Text style={s.userText} selectable>
                      {msg.content}
                    </Text>
                    <View style={s.mensagemStatusRow}>
                      <Text style={s.mensagemHorario}>{horario}</Text>
                      <Ionicons
                        name={respondida ? "checkmark-done" : "checkmark"}
                        size={13}
                        color={respondida ? "#53BDEB" : "rgba(255,255,255,0.75)"}
                      />
                    </View>
                  </>
                )
              ) : (
                <>
                  {tagUrgencia && (
                    <View
                      style={[
                        s.triageTag,
                        {
                          backgroundColor: `${tagUrgencia.cor}1A`,
                          borderColor: tagUrgencia.cor,
                        },
                      ]}
                    >
                      <Ionicons
                        name={tagUrgencia.icone}
                        size={12}
                        color={tagUrgencia.cor}
                      />
                      <Text
                        style={[s.triageTagText, { color: tagUrgencia.cor }]}
                      >
                        {tagUrgencia.rotulo}
                      </Text>
                    </View>
                  )}

                  {msg.audioUri ? (
                    <>
                      <AudioMessageBubble
                        uri={msg.audioUri}
                        duracaoAproximada={msg.audioDuration ?? 0}
                        s={s}
                        variante="assistant"
                        corAccent={c.accentLight}
                        horario={horario}
                      />
                      <Pressable
                        onPress={() => setMostrarTexto((v) => !v)}
                        style={s.audioTranscricaoToggle}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={
                          mostrarTexto ? "Ocultar transcrição" : "Ver transcrição"
                        }
                      >
                        <Ionicons
                          name={mostrarTexto ? "chevron-up" : "chevron-down"}
                          size={12}
                          color={c.accentLight}
                        />
                        <Text style={s.audioTranscricaoToggleTexto}>
                          {mostrarTexto ? "Ocultar transcrição" : "Ver transcrição"}
                        </Text>
                      </Pressable>
                      {mostrarTexto && (
                        <RichText
                          content={texto}
                          style={[s.aiText, s.audioTranscricaoTexto]}
                          accentColor={c.accentLight}
                          codeBackground={theme.tint(0.12)}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <RichText
                        content={texto}
                        style={s.aiText}
                        accentColor={c.accentLight}
                        codeBackground={theme.tint(0.12)}
                      />
                      {!mostrarCursor && !!horario && (
                        <Text style={s.mensagemHorarioAiTexto}>{horario}</Text>
                      )}
                    </>
                  )}

                  {mostrarCursor && <View style={s.cursor} />}
                </>
              )}
            </View>

            {!isUser && (
              <View style={s.messageActions}>
                <Pressable
                  style={s.messageAction}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Resposta útil"
                  accessibilityState={{ selected: feedback === "like" }}
                  onPress={() => onFeedback(index, "like")}
                >
                  <Ionicons
                    name={feedback === "like" ? "thumbs-up" : "thumbs-up-outline"}
                    size={15}
                    color={feedback === "like" ? c.accentLight : c.textSecondary}
                  />
                </Pressable>

                <Pressable
                  style={s.messageAction}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Resposta não ajudou"
                  accessibilityState={{ selected: feedback === "dislike" }}
                  onPress={() => onFeedback(index, "dislike")}
                >
                  <Ionicons
                    name={
                      feedback === "dislike"
                        ? "thumbs-down"
                        : "thumbs-down-outline"
                    }
                    size={15}
                    color={
                      feedback === "dislike" ? c.accentLight : c.textSecondary
                    }
                  />
                </Pressable>

                <Pressable
                  style={s.messageAction}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Compartilhar resposta"
                  onPress={() => onShare(msg.content)}
                >
                  <Ionicons
                    name="share-outline"
                    size={15}
                    color={c.textSecondary}
                  />
                </Pressable>
              </View>
            )}
          </View>

          {isUser && (
            <View style={s.userAvatar}>
              <Ionicons name="person" size={14} color={c.white} />
            </View>
          )}
        </View>
      </Entrada>
    );
  },
  (a, b) =>
    a.texto === b.texto &&
    a.msg.content === b.msg.content &&
    a.msg.audioUri === b.msg.audioUri &&
    a.msg.imageUri === b.msg.imageUri &&
    a.mostrarCursor === b.mostrarCursor &&
    a.feedback === b.feedback &&
    a.s === b.s &&
    a.respondida === b.respondida &&
    a.tagUrgencia?.rotulo === b.tagUrgencia?.rotulo,
);

/* ============================================================
   TELA
============================================================ */

export default function PetChatScreen() {
  const navigation = useNavigation<Nav>();
  const r = useResponsive();
  const reduceMotion = useReduceMotion();

  /* ---------- tema ---------- */

  const systemTheme = useTheme();
  const [darkMode, setDarkMode] = useState<boolean>(systemTheme.isDark);

  const theme = useMemo<Theme>(() => {
    const isDark = darkMode;
    return {
      colors: isDark ? DarkColors : LightColors,
      isDark,
      overlay: (o: number) =>
        isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o})`,
      tint: (o: number) =>
        isDark ? `rgba(90,169,255,${o})` : `rgba(74,158,255,${o})`,
    };
  }, [darkMode]);

  const c = theme.colors;
  const s = useMemo(() => makeStyles(theme, r), [theme, r]);

  const toggleTheme = useCallback(() => setDarkMode((v) => !v), []);

  /* ---------- dados ---------- */

  const { pets } = usePets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const pet =
    pets.find((p) => p.id === selectedPetId) ?? (pets.length ? pets[0] : null);

  useEffect(() => {
    if (!selectedPetId && pets.length) setSelectedPetId(pets[0].id);
  }, [pets, selectedPetId]);

  const { messages, sending, lastResult, send, sendAudio, sendImage, updateMessage, reset } =
    useAiChat(pet);
  const { data: risk } = usePetRisk(pet);

  /* ---------- voz ---------- */

  const voz = useVoiceRecorder();
  const fala = useSpeechOutput();
  const imagePicker = useImagePicker();
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  /* ---------- estado de UI ---------- */

  const [input, setInput] = useState("");
  const [inputFocado, setInputFocado] = useState(false);
  const [alturaInput, setAlturaInput] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  const [showPetStats, setShowPetStats] = useState(false);
  const [showAlertsDetail, setShowAlertsDetail] = useState(false);
  const [showRiskDetail, setShowRiskDetail] = useState(false);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [indiceResultado, setIndiceResultado] = useState(0);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [sidebarVisivel, setSidebarVisivel] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback>({});

  const [streamedText, setStreamedText] = useState("");
  const streamIndexRef = useRef(-1);
  const primeiraCargaRef = useRef(true);
  const noFimRef = useRef(true);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const sidebarFixa = r.sidebarMode === "permanent";
  const drawerVisivel = sidebarFixa ? sidebarVisivel : drawerAberto;

  /* ---------- animações ---------- */

  const avatarPulse = useRef(new Animated.Value(1)).current;
  const avatarGlow = useRef(new Animated.Value(0.25)).current;
  const welcomeScale = useRef(new Animated.Value(0.94)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const gravacaoPulse = useRef(new Animated.Value(1)).current;
  const triageAnim = useRef(new Animated.Value(0)).current;
  const scrollBtnAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const riskAnim = useRef(new Animated.Value(0)).current;

  // Entrada da tela + respiração do avatar.
  useEffect(() => {
    Animated.parallel([
      Animated.spring(welcomeScale, {
        toValue: 1,
        friction: 8,
        tension: 44,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: reduceMotion ? 0 : 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (reduceMotion) return;

    const pulso = Animated.loop(
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
    );

    const brilho = Animated.loop(
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
    );

    pulso.start();
    brilho.start();

    return () => {
      pulso.stop();
      brilho.stop();
    };
  }, [reduceMotion, avatarPulse, avatarGlow, welcomeScale, welcomeOpacity]);

  useEffect(() => {
    if (!sending || reduceMotion) {
      typingAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sending, reduceMotion, typingAnim]);

  useEffect(() => {
    if (!voz.gravando || reduceMotion) {
      gravacaoPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gravacaoPulse, {
          toValue: 0.3,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(gravacaoPulse, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [voz.gravando, reduceMotion, gravacaoPulse]);

  useEffect(() => {
    if (!showTriage) return;
    triageAnim.setValue(0);
    Animated.spring(triageAnim, {
      toValue: 1,
      friction: 9,
      tension: 42,
      useNativeDriver: true,
    }).start();
  }, [showTriage, triageAnim]);

  useEffect(() => {
    Animated.timing(scrollBtnAnim, {
      toValue: showScrollButton ? 1 : 0,
      duration: reduceMotion ? 0 : 220,
      useNativeDriver: true,
    }).start();
  }, [showScrollButton, reduceMotion, scrollBtnAnim]);

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: drawerVisivel ? 1 : 0,
      duration: reduceMotion ? 0 : 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [drawerVisivel, reduceMotion, drawerAnim]);

  useEffect(() => {
    Animated.timing(riskAnim, {
      toValue: risk?.riskScore ?? 0,
      duration: reduceMotion ? 0 : 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [risk?.riskScore, reduceMotion, riskAnim]);

  // Fecha o overlay ao girar para um layout com sidebar fixa.
  useEffect(() => {
    if (sidebarFixa) setDrawerAberto(false);
  }, [sidebarFixa]);

  /* ---------- streaming de texto ---------- */

  useEffect(() => {
    const ultima = messages[messages.length - 1] as ChatMessage | undefined;
    if (!ultima || ultima.role !== "assistant") return;

    const indice = messages.length - 1;

    // Histórico já carregado: mostra inteiro, sem digitar.
    if (primeiraCargaRef.current) {
      primeiraCargaRef.current = false;
      streamIndexRef.current = indice;
      setStreamedText(ultima.content);
      return;
    }

    if (streamIndexRef.current === indice) return;

    streamIndexRef.current = indice;
    const idMensagemFalada = ultima.id;
    fala.falar(ultima.content).then((resultado) => {
      if (resultado.uri && idMensagemFalada) {
        updateMessage(idMensagemFalada, { audioUri: resultado.uri });
      }
    });

    if (reduceMotion) {
      setStreamedText(ultima.content);
      return;
    }

    setStreamedText("");

    // Velocidade constante por tempo, não por tick: o texto sai no mesmo
    // ritmo em qualquer aparelho.
    const total = ultima.content.length;
    const inicio = Date.now();
    const charsPorSegundo = 220;

    const timer = setInterval(() => {
      const decorrido = (Date.now() - inicio) / 1000;
      const pos = Math.min(total, Math.ceil(decorrido * charsPorSegundo));
      setStreamedText(ultima.content.slice(0, pos));
      if (pos >= total) clearInterval(timer);
    }, 32);

    return () => clearInterval(timer);
  }, [messages, reduceMotion, fala.falar, updateMessage]);

  /* ---------- rolagem ---------- */

  const irParaOFim = useCallback((animated = true) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  const aoRolar = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distancia =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    noFimRef.current = distancia < 120;
    setShowScrollButton(distancia > 200);
  }, []);

  const aoMudarTamanho = useCallback(() => {
    if (noFimRef.current) irParaOFim(true);
  }, [irParaOFim]);

  /* ---------- busca na conversa ---------- */

  const resultadosBusca = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return [] as number[];
    const indices: number[] = [];
    messages.forEach((m, i) => {
      if (m.content.toLowerCase().includes(termo)) indices.push(i);
    });
    return indices;
  }, [messages, termoBusca]);

  useEffect(() => {
    setIndiceResultado(0);
  }, [termoBusca]);

  const irParaResultado = useCallback(
    (novoIndice: number) => {
      if (!resultadosBusca.length) return;
      const seguro =
        ((novoIndice % resultadosBusca.length) + resultadosBusca.length) %
        resultadosBusca.length;
      setIndiceResultado(seguro);
      listRef.current?.scrollToIndex({
        index: resultadosBusca[seguro],
        animated: true,
        viewPosition: 0.3,
      });
    },
    [resultadosBusca],
  );

  useEffect(() => {
    if (resultadosBusca.length) irParaResultado(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadosBusca.length > 0 ? resultadosBusca[0] : -1]);

  const fecharBusca = useCallback(() => {
    setBuscaAberta(false);
    setTermoBusca("");
  }, []);

  const aoFalharScrollBusca = useCallback((info: { index: number }) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: true });
    }, 120);
  }, []);

  /* ---------- ações ---------- */

  const handleSend = useCallback(
    async (texto?: string) => {
      const conteudo = (texto ?? input).trim();
      if (!conteudo || sending) return;

      setInput("");
      setAlturaInput(0);
      setShowSuggestions(false);
      setShowQuickActions(false);
      setShowTriage(false);
      if (!sidebarFixa) setDrawerAberto(false);
      noFimRef.current = true;
      Keyboard.dismiss();

      await send(conteudo);
    },
    [input, sending, send, sidebarFixa],
  );

  const handleSendVoice = useCallback(
    async (texto: string, audioUri: string, duracao: number) => {
      const conteudo = texto.trim();
      if (!conteudo || sending) return;

      setShowSuggestions(false);
      setShowQuickActions(false);
      setShowTriage(false);
      if (!sidebarFixa) setDrawerAberto(false);
      noFimRef.current = true;
      Keyboard.dismiss();

      await sendAudio(conteudo, audioUri, duracao);
    },
    [sending, sendAudio, sidebarFixa],
  );

  const handleMicPress = useCallback(async () => {
    if (sending || voz.transcrevendo) return;

    if (voz.gravando) {
      const { texto, erro, uri, duracao } = await voz.parar();
      if (texto && uri) {
        await handleSendVoice(texto, uri, duracao);
      } else if (erro) {
        showAlert("Não deu para entender o áudio", erro);
      }
      return;
    }

    fala.pararFala();
    const { ok, erro } = await voz.iniciar();
    if (!ok && erro) {
      showAlert("Microfone indisponível", erro);
    }
  }, [sending, voz, fala, handleSendVoice]);

  const handleCancelarGravacao = useCallback(() => {
    voz.cancelar();
  }, [voz]);

  const handleEnviarFoto = useCallback(
    async (origem: "camera" | "galeria") => {
      if (enviandoFoto || sending) return;

      setShowQuickActions(false);

      const { foto, erro } =
        origem === "camera" ? await imagePicker.tirarFoto() : await imagePicker.escolherDaGaleria();

      if (erro) {
        showAlert("Não deu para acessar isso", erro);
        return;
      }
      if (!foto) return;

      setEnviandoFoto(true);
      try {
        setShowSuggestions(false);
        setShowTriage(false);
        if (!sidebarFixa) setDrawerAberto(false);
        noFimRef.current = true;
        await sendImage("Avalie essa foto do meu pet.", foto.uri, foto.base64);
      } finally {
        setEnviandoFoto(false);
      }
    },
    [enviandoFoto, sending, imagePicker, sidebarFixa, sendImage],
  );

  const handleClearChat = useCallback(() => {
    if (!messages.length) return;
    showAlert("Limpar conversa", "Isso apaga todas as mensagens desta conversa.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: () => {
          reset();
          setShowSuggestions(true);
          setShowQuickActions(false);
          setShowTriage(false);
          setFeedbacks({});
          setStreamedText("");
          streamIndexRef.current = -1;
          primeiraCargaRef.current = true;
        },
      },
    ]);
  }, [messages.length, reset]);

  const acaoDestino: Partial<Record<SuggestedAction, keyof RootStackParamList>> =
    useMemo(
      () => ({
        agendar_consulta: "HealthCalendar",
        atualizar_vacina: "Vaccines",
      }),
      [],
    );

  const handleQuickAction = useCallback(
    (action: SuggestedAction) => {
      const alvo = acaoDestino[action];
      if (!alvo) return;
      setShowQuickActions(false);
      navigation.navigate(alvo as never);
    },
    [acaoDestino, navigation],
  );

  const handleTriage = useCallback(
    (termo: string) => {
      setShowTriage(false);
      setShowSuggestions(false);
      handleSend(`Quero fazer uma triagem. O meu pet está ${termo}.`);
    },
    [handleSend],
  );

  const handleFeedback = useCallback((index: number, valor: "like" | "dislike") => {
    setFeedbacks((atual) => ({ ...atual, [index]: valor }));
  }, []);

  const handleShare = useCallback(async (texto: string) => {
    try {
      await Share.share({ message: texto });
    } catch {
      /* usuário cancelou */
    }
  }, []);

  /* ---------- derivados ---------- */

  const urgencyMeta = useCallback(
    (urgency?: string) => {
      if (urgency === "emergencia")
        return { cor: c.accentRed, rotulo: "Emergência", icone: "warning" as IconName };
      if (urgency === "alta")
        return { cor: c.accentOrange, rotulo: "Urgente", icone: "alert-circle" as IconName };
      if (urgency === "media")
        return { cor: c.accentLight, rotulo: "Avaliar", icone: "time-outline" as IconName };
      return {
        cor: c.accentGreen,
        rotulo: "Rotina",
        icone: "checkmark-circle-outline" as IconName,
      };
    },
    [c],
  );

  const urgente =
    lastResult?.urgency === "alta" || lastResult?.urgency === "emergencia";
  const emergencia = lastResult?.urgency === "emergencia";
  const destino = lastResult ? acaoDestino[lastResult.suggestedAction] : undefined;

  const score = risk?.riskScore ?? 0;
  const riskCor =
    score >= 60 ? c.accentRed : score >= 30 ? c.accentOrange : c.accentGreen;

  const petStats = useMemo(() => {
    const vacinas = pet?.vaccines ?? [];
    const medicacoes = pet?.medications ?? [];
    const alertas = risk?.alerts ?? [];
    const vacinasEmDia = vacinas.filter((v) => v.done).length;

    return {
      vacinasEmDia,
      vacinasPendentes: vacinas.length - vacinasEmDia,
      totalVacinas: vacinas.length,
      medicacoesAtivas: medicacoes.filter((m) => m.active).length,
      totalAlertas: alertas.length,
      alertasCriticos: alertas.filter((a) => a.severity === "critico").length,
      alertasAtencao: alertas.filter((a) => a.severity === "atencao").length,
    };
  }, [pet, risk]);

  const alertColor = (sev: AiAlert["severity"]) =>
    sev === "critico" ? c.accentRed : sev === "atencao" ? c.accentOrange : c.accentLight;

  const alertIcon = (sev: AiAlert["severity"]): IconName =>
    sev === "critico"
      ? "alert-circle"
      : sev === "atencao"
        ? "warning-outline"
        : "information-circle-outline";

  const alertasVisiveis = (lastResult?.alerts ?? []).slice(0, 3);
  const ultimaEhDaIa =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";
  const mostrarAlertas = !sending && ultimaEhDaIa && alertasVisiveis.length > 0;

  const fotoRaca = useBreedPhoto(pet);
  const colar = useMockColar(pet?.id);

  const petImage =
    (pet as any)?.imageUri ??
    (pet as any)?.photoUri ??
    (pet as any)?.image ??
    (pet as any)?.photo ??
    fotoRaca ??
    null;

  const podeEnviar = input.trim().length > 0 && !sending;

  /* ============================================================
     SIDEBAR / DRAWER
  ============================================================ */

  const conteudoDrawer = (
    <>
      <ScrollView
        contentContainerStyle={s.drawerScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.drawerHeader}>
          <View style={s.drawerLogoRow}>
            <Ionicons name="sparkles" size={19} color={c.accentLight} />
            <Text style={s.drawerLogoText}>Clyvo</Text>
          </View>

          <Pressable
            onPress={() =>
              sidebarFixa ? setSidebarVisivel(false) : setDrawerAberto(false)
            }
            style={s.drawerIconBtn}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
          >
            <Ionicons
              name={sidebarFixa ? "chevron-back" : "close"}
              size={20}
              color={c.textSecondary}
            />
          </Pressable>
        </View>

        <View style={s.drawerSegmented}>
          <Pressable style={[s.drawerSegmentBtn, s.drawerSegmentBtnAtivo]}>
            <Text style={s.drawerSegmentTextAtivo}>Conversa</Text>
          </Pressable>
          <Pressable
            style={s.drawerSegmentBtn}
            onPress={() =>
              showAlert(
                "Em breve",
                "O modo Clínica ainda está em desenvolvimento.",
              )
            }
          >
            <Text style={s.drawerSegmentText}>Clínica</Text>
            <View style={s.betaBadge}>
              <Text style={s.betaBadgeText}>Beta</Text>
            </View>
          </Pressable>
        </View>

        <View style={s.drawerBloco}>
          <Pressable
            style={s.drawerItem}
            onPress={() => {
              handleClearChat();
              if (!sidebarFixa) setDrawerAberto(false);
            }}
            accessibilityRole="button"
          >
            <Ionicons
              name="create-outline"
              size={19}
              color={c.text}
              style={s.drawerItemIcon}
            />
            <Text style={s.drawerItemText}>Nova conversa</Text>
          </Pressable>

          <Pressable
            style={s.drawerItem}
            accessibilityRole="button"
            onPress={() => {
              setBuscaAberta(true);
              if (!sidebarFixa) setDrawerAberto(false);
            }}
          >
            <Ionicons
              name="search-outline"
              size={19}
              color={c.text}
              style={s.drawerItemIcon}
            />
            <Text style={s.drawerItemText}>Pesquisar conversas</Text>
          </Pressable>

          <Pressable
            style={s.drawerItem}
            accessibilityRole="button"
            onPress={() =>
              showAlert(
                "Em breve",
                "A galeria de fotos do pet ainda não está disponível nesta versão do app.",
              )
            }
          >
            <Ionicons
              name="images-outline"
              size={19}
              color={c.text}
              style={s.drawerItemIcon}
            />
            <Text style={s.drawerItemText}>Galeria do pet</Text>
          </Pressable>

          <Pressable
            style={s.drawerItem}
            accessibilityRole="button"
            onPress={() =>
              showAlert(
                "Em breve",
                "A biblioteca médica ainda não está disponível nesta versão do app.",
              )
            }
          >
            <Ionicons
              name="library-outline"
              size={19}
              color={c.text}
              style={s.drawerItemIcon}
            />
            <Text style={s.drawerItemText}>Biblioteca médica</Text>
          </Pressable>
        </View>

        <View style={s.drawerBloco}>
          <Text style={s.drawerSectionTitle}>Meus pets</Text>

          {pets.map((p) => {
            const ativo = p.id === (selectedPetId ?? pet?.id);
            return (
              <Pressable
                key={p.id}
                style={[s.drawerItem, ativo && s.drawerItemAtivo]}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                onPress={() => {
                  setSelectedPetId(p.id);
                  if (!sidebarFixa) setDrawerAberto(false);
                }}
              >
                <View style={s.drawerItemIcon}>
                  <DrawerPetAvatar
                    pet={p}
                    s={s}
                    cor={ativo ? c.accentLight : c.textSecondary}
                    reduceMotion={reduceMotion}
                  />
                </View>
                <Text
                  style={[s.drawerItemText, ativo && s.drawerItemTextAtivo]}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={s.drawerItem}
            accessibilityRole="button"
            onPress={() => {
              if (!sidebarFixa) setDrawerAberto(false);
              navigation.navigate("AddPet");
            }}
          >
            <Ionicons
              name="add"
              size={20}
              color={c.textSecondary}
              style={s.drawerItemIcon}
            />
            <Text style={s.drawerItemText}>Adicionar pet</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={s.drawerFooter}>
        <View style={s.drawerAvatar}>
          <Text style={s.drawerAvatarText}>T</Text>
        </View>
        <View style={s.drawerPerfilInfo}>
          <Text style={s.drawerPerfilNome}>Tutor</Text>
          <Text style={s.drawerPerfilPlano}>Plano Pro</Text>
        </View>
        <Pressable
          style={s.drawerIconBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Configurações"
        >
          <Ionicons name="settings-outline" size={20} color={c.textSecondary} />
        </Pressable>
      </View>
    </>
  );

  /* ============================================================
     BLOCO DE BOAS-VINDAS
  ============================================================ */

  const boasVindas = (
    <Animated.View
      style={[
        s.welcomeContainer,
        { opacity: welcomeOpacity, transform: [{ scale: welcomeScale }] },
      ]}
    >
      {!r.isShort && (
        <View style={s.heroArea}>
          <Animated.View
            style={[s.heroGlowBackdrop, { opacity: avatarGlow }]}
            pointerEvents="none"
          />
          <View style={s.heroOrbitThree} />
          <View style={s.heroOrbitTwo} />
          <View style={s.heroOrbitOne} />
          <Animated.View
            style={[s.heroAvatar, { transform: [{ scale: avatarPulse }] }]}
          >
            {petImage ? (
              <FotoComFade
                uri={petImage}
                style={s.heroPetImage}
                reduceMotion={reduceMotion}
              />
            ) : (
              <Ionicons name="sparkles" size={r.fs(38)} color={c.accentLight} />
            )}
          </Animated.View>
          <View style={s.heroSparkle}>
            <Ionicons name="sparkles" size={12} color={c.white} />
          </View>
        </View>
      )}

      <Text style={s.welcomeTitle}>
        {pet ? `Oi! Vamos falar do ${pet.name}?` : "Oi! Eu sou o Clyvo"}
      </Text>
      <Text style={s.welcomeSubtitle}>
        Pergunte sobre vacinas, sintomas ou rotina.{" "}
        {pet
          ? `Eu consulto o histórico do ${pet.name} antes de responder.`
          : "Cadastre um pet para respostas personalizadas."}
      </Text>

      <View style={s.trustRow}>
        <View style={s.trustItem}>
          <Ionicons name="shield-checkmark" size={13} color={c.accentGreen} />
          <Text style={s.trustText}>Usa o histórico</Text>
        </View>
        <View style={s.trustDivider} />
        <View style={s.trustItem}>
          <Ionicons name="flash" size={13} color={c.accentLight} />
          <Text style={s.trustText}>Resposta imediata</Text>
        </View>
      </View>

      <Toque
        style={s.triageLaunch}
        contentStyle={s.toqueRowConteudo}
        onPress={() => setShowTriage(true)}
        reduceMotion={reduceMotion}
        accessibilityLabel="Iniciar triagem de sintomas"
      >
        <View style={s.triageLaunchIcon}>
          <Ionicons name="pulse" size={20} color={c.white} />
        </View>
        <View style={s.triageLaunchContent}>
          <Text style={s.triageLaunchTitle}>Iniciar uma triagem</Text>
          <Text style={s.triageLaunchText}>
            Descreva o sintoma e eu avalio a urgência
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.white} />
      </Toque>

      {showSuggestions && (
        <View style={s.suggestionsContainer}>
          <View style={s.suggestionsHeader}>
            <Text style={s.suggestionsTitle}>Comece por aqui</Text>
            <Pressable
              onPress={() => setShowSuggestions(false)}
              style={s.drawerIconBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Ocultar sugestões"
            >
              <Ionicons name="close" size={17} color={c.textSecondary} />
            </Pressable>
          </View>

          <View style={s.suggestionsGrid}>
            {SUGESTOES.map((sug, i) => (
              <Entrada key={sug.text} disabled={reduceMotion} delay={i * 70} style={s.suggestionCard}>
                <Toque
                  style={s.toqueFillRow}
                  contentStyle={s.toqueRowConteudo}
                  onPress={() => handleSend(sug.text)}
                  reduceMotion={reduceMotion}
                >
                  <View style={s.suggestionIcon}>
                    <Ionicons name={sug.icon} size={18} color={c.accentLight} />
                  </View>
                  <Text style={s.suggestionText}>{sug.text}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={c.accentLight}
                    style={s.suggestionArrow}
                  />
                </Toque>
              </Entrada>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );

  /* ============================================================
     RODAPÉ DA LISTA (fontes, alertas, CTA, digitando)
  ============================================================ */

  const rodapeLista = (
    <View>
      {!sending && ultimaEhDaIa && (lastResult?.sources?.length ?? 0) > 0 && (
        <View style={s.sourcesRow}>
          <Ionicons name="library-outline" size={12} color={c.textSecondary} />
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
            {pet ? `Do prontuário do ${pet.name}` : "Do prontuário"}
          </Text>
          {alertasVisiveis.map((a) => (
            <View
              key={a.code + a.title}
              style={[s.alertChip, { borderLeftColor: alertColor(a.severity) }]}
            >
              <Ionicons
                name={alertIcon(a.severity)}
                size={15}
                color={alertColor(a.severity)}
              />
              <View style={s.alertChipContent}>
                <Text style={s.alertChipTitle}>{a.title}</Text>
                <Text style={s.alertChipDetail}>{a.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {destino && !sending && (
        <Pressable
          style={({ pressed }) => [s.cta, pressed && s.pressed]}
          onPress={() => navigation.navigate(destino as never)}
          accessibilityRole="button"
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
            <Text style={s.ctaTitle}>
              {lastResult?.suggestedAction === "atualizar_vacina"
                ? "Abrir carteira de vacinas"
                : "Abrir agenda de saúde"}
            </Text>
            <Text style={s.ctaDescription}>Sugerido a partir desta conversa</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.accentLight} />
        </Pressable>
      )}

      {sending && (
        <View style={s.typingRow}>
          <View style={s.messageAvatar}>
            <Ionicons name="sparkles" size={14} color={c.white} />
          </View>
          <View style={s.skeletonBubble}>
            <View style={s.skeletonHeader}>
              <View style={s.typingDots}>
                {[0, 1, 2].map((i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.typingDot,
                      {
                        opacity: typingAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange:
                            i === 1 ? [1, 0.3, 1] : [0.3, 1, 0.3],
                        }),
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={s.typingText}>
                {pet ? `Consultando o histórico do ${pet.name}` : "Pensando"}
              </Text>
            </View>

            {[0.92, 0.78, 0.55].map((larg, i) => (
              <Animated.View
                key={i}
                style={[
                  s.skeletonLine,
                  {
                    width: `${larg * 100}%`,
                    opacity: typingAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: i % 2 === 0 ? [0.2, 0.5, 0.2] : [0.5, 0.2, 0.5],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );

  /* ============================================================
     PAINEL DE NÚMEROS DO PET
  ============================================================ */

  const cartoesPet: {
    cor: string;
    valor: string;
    label: string;
    sub: string;
    onPress?: () => void;
  }[] = [
    {
      cor: riskCor,
      valor: risk ? `${risk.riskScore}` : "—",
      label: "Risco atual",
      sub: risk ? `Nível ${risk.riskLabel}` : "Sem avaliação",
      onPress: () => setShowRiskDetail(true),
    },
    {
      cor: c.accentGreen,
      valor: `${petStats.vacinasEmDia}/${petStats.totalVacinas}`,
      label: "Vacinas em dia",
      sub:
        petStats.vacinasPendentes > 0
          ? `${petStats.vacinasPendentes} pendente(s)`
          : "Nenhuma pendência",
    },
    {
      cor: c.accentLight,
      valor: `${petStats.medicacoesAtivas}`,
      label: "Medicações ativas",
      sub: petStats.medicacoesAtivas > 0 ? "Em uso agora" : "Nenhuma em uso",
    },
    {
      cor: petStats.alertasCriticos > 0 ? c.accentRed : c.accentOrange,
      valor: `${petStats.totalAlertas}`,
      label: "Alertas ativos",
      sub:
        petStats.totalAlertas > 0
          ? `${petStats.alertasCriticos} crítico(s), ${petStats.alertasAtencao} atenção`
          : "Tudo tranquilo",
      onPress: () => setShowAlertsDetail(true),
    },
  ];

  const painelNumerosPet = (
    <View style={s.statsPanelInner}>
      <View style={s.statsPanelHeader}>
        <View>
          <Text style={s.statsPanelTitle}>
            {pet ? `Números do ${pet.name}` : "Números do pet"}
          </Text>
          <Text style={s.statsPanelSubtitle}>
            {pet?.species || pet?.breed
              ? [pet.species, pet.breed].filter(Boolean).join(" · ")
              : "Selecione um pet"}
          </Text>
        </View>
        {!(r.statsPanelWidth > 0) && (
          <Pressable
            style={s.drawerIconBtn}
            hitSlop={10}
            onPress={() => setShowPetStats(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar números do pet"
          >
            <Ionicons name="close" size={18} color={c.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={s.statsPanelInfoRow}>
        <View style={s.statsPanelInfoItem}>
          <Text style={s.statsPanelInfoLabel}>Idade</Text>
          <Text style={s.statsPanelInfoValue}>{pet?.age || "—"}</Text>
        </View>
        <View style={s.statsPanelInfoItem}>
          <Text style={s.statsPanelInfoLabel}>Peso</Text>
          <Text style={s.statsPanelInfoValue}>{pet?.weight || "—"}</Text>
        </View>
        <View style={s.statsPanelInfoItem}>
          <Text style={s.statsPanelInfoLabel}>Checkup</Text>
          <Text style={s.statsPanelInfoValue} numberOfLines={1}>
            {pet?.nextCheckup || "—"}
          </Text>
        </View>
      </View>

      <View style={s.statsCardsWrap}>
        {cartoesPet.map((card, i) => {
          const corpo = (
            <View style={s.statCard}>
              <View style={[s.statCardAccent, { backgroundColor: card.cor }]} />
              <View style={s.statCardBody}>
                <View style={s.statCardTopRow}>
                  <Text style={s.statCardLabel}>{card.label}</Text>
                  {card.onPress && (
                    <Ionicons
                      name="chevron-forward"
                      size={13}
                      color={c.textSecondary}
                    />
                  )}
                </View>
                <Text style={[s.statCardValue, { color: card.cor }]}>
                  {card.valor}
                </Text>
                <Text style={s.statCardSub} numberOfLines={1}>
                  {card.sub}
                </Text>
              </View>
            </View>
          );

          return (
            <Entrada key={card.label} disabled={reduceMotion} delay={i * 80}>
              {card.onPress ? (
                <Toque
                  style={s.toqueFillColumn}
                  onPress={card.onPress}
                  reduceMotion={reduceMotion}
                  accessibilityLabel={`${card.label}: ${card.valor}`}
                >
                  {corpo}
                </Toque>
              ) : (
                corpo
              )}
            </Entrada>
          );
        })}
      </View>

      <View style={s.colarSecao}>
        <View style={s.colarTituloRow}>
          <Ionicons name="hardware-chip-outline" size={13} color={c.textSecondary} />
          <Text style={s.colarTitulo}>Coleira ClyvoVet · dado de exemplo (POC)</Text>
        </View>

        <View style={s.statsCardsWrap}>
          <Entrada disabled={reduceMotion} delay={cartoesPet.length * 80}>
            <View style={s.statCard}>
              <View
                style={[
                  s.statCardAccent,
                  {
                    backgroundColor:
                      colar.bpm < 60 || colar.bpm > 130 ? c.accentOrange : c.accentRed,
                  },
                ]}
              />
              <View style={s.statCardBody}>
                <View style={s.statCardTopRow}>
                  <Text style={s.statCardLabel}>Batimentos</Text>
                  <BatimentoIcon
                    bpm={colar.bpm}
                    cor={colar.bpm < 60 || colar.bpm > 130 ? c.accentOrange : c.accentRed}
                    reduceMotion={reduceMotion}
                  />
                </View>
                <Text
                  style={[
                    s.statCardValue,
                    { color: colar.bpm < 60 || colar.bpm > 130 ? c.accentOrange : c.accentRed },
                  ]}
                >
                  {colar.bpm}
                  <Text style={s.statCardUnidade}> bpm</Text>
                </Text>
                <Text style={s.statCardSub}>Leitura simulada da coleira</Text>
              </View>
            </View>
          </Entrada>

          <Entrada disabled={reduceMotion} delay={cartoesPet.length * 80 + 80}>
            <View style={s.statCard}>
              <View
                style={[
                  s.statCardAccent,
                  {
                    backgroundColor:
                      colar.temperatura < 38.3 || colar.temperatura > 39.2
                        ? c.accentOrange
                        : c.accentGreen,
                  },
                ]}
              />
              <View style={s.statCardBody}>
                <View style={s.statCardTopRow}>
                  <Text style={s.statCardLabel}>Temperatura</Text>
                  <TermometroIcon
                    cor={
                      colar.temperatura < 38.3 || colar.temperatura > 39.2
                        ? c.accentOrange
                        : c.accentGreen
                    }
                    reduceMotion={reduceMotion}
                  />
                </View>
                <Text
                  style={[
                    s.statCardValue,
                    {
                      color:
                        colar.temperatura < 38.3 || colar.temperatura > 39.2
                          ? c.accentOrange
                          : c.accentGreen,
                    },
                  ]}
                >
                  {colar.temperatura.toFixed(1)}
                  <Text style={s.statCardUnidade}>°C</Text>
                </Text>
                <Text style={s.statCardSub}>Leitura simulada da coleira</Text>
              </View>
            </View>
          </Entrada>
        </View>
      </View>
    </View>
  );

  /* ============================================================
     RENDER
  ============================================================ */

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const ehUltima = index === messages.length - 1;
      const emStream = index === streamIndexRef.current;
      const respondida = messages[index + 1]?.role === "assistant";

      return (
        <Bolha
          msg={item}
          index={index}
          s={s}
          theme={theme}
          texto={emStream ? streamedText || item.content : item.content}
          mostrarCursor={emStream && streamedText.length < item.content.length}
          tagUrgencia={
            ehUltima && item.role === "assistant" && lastResult
              ? urgencyMeta(lastResult.urgency)
              : null
          }
          feedback={feedbacks[index]}
          onFeedback={handleFeedback}
          onShare={handleShare}
          semAnimacao={reduceMotion}
          respondida={respondida}
          aoAbrirImagem={setImagemAmpliada}
        />
      );
    },
    [
      messages,
      s,
      theme,
      streamedText,
      lastResult,
      urgencyMeta,
      feedbacks,
      handleFeedback,
      handleShare,
      reduceMotion,
    ],
  );

  return (
    <View style={s.root}>
      {/* ---------- SIDEBAR FIXA (tablet deitado) ---------- */}
      {sidebarFixa && sidebarVisivel && (
        <View style={s.sidebarFixa}>{conteudoDrawer}</View>
      )}

      {/* ---------- COLUNA PRINCIPAL ---------- */}
      <KeyboardAvoidingView
        style={s.mainColumn}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerGlowOne} pointerEvents="none" />
          <View style={s.headerGlowTwo} pointerEvents="none" />

          {(!sidebarFixa || !sidebarVisivel) && (
            <Pressable
              style={({ pressed }) => [s.headerButton, pressed && s.pressed]}
              onPress={() =>
                sidebarFixa ? setSidebarVisivel(true) : setDrawerAberto(true)
              }
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Abrir menu"
            >
              <Ionicons name="menu" size={22} color={c.white} />
            </Pressable>
          )}

          <View style={s.avatarWrapper}>
            <Animated.View
              style={[
                s.avatarGlow,
                { opacity: avatarGlow, transform: [{ scale: avatarPulse }] },
              ]}
              pointerEvents="none"
            />
            <Animated.View
              style={[s.headerAvatar, { transform: [{ scale: avatarPulse }] }]}
            >
              {petImage ? (
                <FotoComFade
                  uri={petImage}
                  style={s.petImage}
                  reduceMotion={reduceMotion}
                />
              ) : (
                <Ionicons name="paw" size={20} color={c.white} />
              )}
              <View style={s.headerOnlineDot} />
            </Animated.View>
          </View>

          <Pressable
            style={s.headerInfo}
            onPress={() =>
              sidebarFixa ? setSidebarVisivel(true) : setDrawerAberto(true)
            }
            accessibilityRole="button"
            accessibilityLabel="Trocar de pet"
          >
            <View style={s.headerNameRow}>
              <Text style={s.headerTitle} numberOfLines={1}>
                {pet ? pet.name : "Clyvo"}
              </Text>
              <View style={s.aiBadge}>
                <Ionicons name="sparkles" size={9} color={c.white} />
                <Text style={s.aiBadgeText}>IA</Text>
              </View>
            </View>

            {risk && !r.isShort ? (
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
                <Text style={[s.riskLabel, { color: riskCor }]} numberOfLines={1}>
                  risco {risk.riskLabel}
                </Text>
              </View>
            ) : (
              <View style={s.onlineWrapper}>
                <View style={s.onlineDot} />
                <Text style={s.onlineText}>online</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.headerButton, pressed && s.pressed]}
            onPress={fala.alternarVoz}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={
              fala.vozAtiva ? "Desativar respostas em voz" : "Ativar respostas em voz"
            }
            accessibilityState={{ selected: fala.vozAtiva }}
          >
            <Ionicons
              name={
                fala.falando
                  ? "volume-high"
                  : fala.vozAtiva
                    ? "volume-medium-outline"
                    : "volume-mute-outline"
              }
              size={19}
              color={c.white}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.headerButton,
              s.headerButtonGap,
              pressed && s.pressed,
            ]}
            onPress={toggleTheme}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={
              theme.isDark ? "Usar tema claro" : "Usar tema escuro"
            }
          >
            <Ionicons
              name={theme.isDark ? "sunny-outline" : "moon-outline"}
              size={19}
              color={c.white}
            />
          </Pressable>

          {!(r.statsPanelWidth > 0) && (
            <Pressable
              style={({ pressed }) => [
                s.headerButton,
                s.headerButtonGap,
                pressed && s.pressed,
              ]}
              onPress={() => setShowPetStats((v) => !v)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Números do pet"
              accessibilityState={{ expanded: showPetStats }}
            >
              <Ionicons name="bar-chart-outline" size={19} color={c.white} />
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              s.headerButton,
              s.headerButtonGap,
              pressed && s.pressed,
            ]}
            onPress={() => setShowQuickActions((v) => !v)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Ações rápidas"
            accessibilityState={{ expanded: showQuickActions }}
          >
            <Ionicons name="options-outline" size={20} color={c.white} />
          </Pressable>
        </View>

        {/* PAINEL: BUSCA NA CONVERSA */}
        {buscaAberta && (
          <View style={s.painel}>
            <View style={s.painelInner}>
              <View style={s.buscaRow}>
                <Ionicons name="search" size={17} color={c.textSecondary} />
                <TextInput
                  style={s.buscaInput}
                  placeholder="Pesquisar nesta conversa"
                  placeholderTextColor={c.textSecondary}
                  value={termoBusca}
                  onChangeText={setTermoBusca}
                  autoFocus
                  accessibilityLabel="Pesquisar nesta conversa"
                />
                {termoBusca.length > 0 && (
                  <Text style={s.buscaContagem}>
                    {resultadosBusca.length
                      ? `${indiceResultado + 1}/${resultadosBusca.length}`
                      : "0/0"}
                  </Text>
                )}
                <Pressable
                  style={s.drawerIconBtn}
                  hitSlop={10}
                  onPress={() => irParaResultado(indiceResultado - 1)}
                  disabled={!resultadosBusca.length}
                  accessibilityRole="button"
                  accessibilityLabel="Resultado anterior"
                >
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={resultadosBusca.length ? c.text : c.textLight}
                  />
                </Pressable>
                <Pressable
                  style={s.drawerIconBtn}
                  hitSlop={10}
                  onPress={() => irParaResultado(indiceResultado + 1)}
                  disabled={!resultadosBusca.length}
                  accessibilityRole="button"
                  accessibilityLabel="Próximo resultado"
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={resultadosBusca.length ? c.text : c.textLight}
                  />
                </Pressable>
                <Pressable
                  style={s.drawerIconBtn}
                  hitSlop={10}
                  onPress={fecharBusca}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar busca"
                >
                  <Ionicons name="close" size={18} color={c.textSecondary} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* PAINEL: NÚMEROS DO PET */}
        {showPetStats && !(r.statsPanelWidth > 0) && (
          <View style={s.painel}>
            <View style={s.painelInner}>{painelNumerosPet}</View>
          </View>
        )}

        {/* PAINEL: AÇÕES RÁPIDAS */}
        {showQuickActions && (
          <View style={s.painel}>
            <View style={s.painelInner}>
              <View style={s.painelHeader}>
                <Text style={s.painelTitle}>Atalhos</Text>
                <Pressable
                  style={s.drawerIconBtn}
                  hitSlop={10}
                  onPress={() => setShowQuickActions(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar atalhos"
                >
                  <Ionicons name="close" size={18} color={c.textSecondary} />
                </Pressable>
              </View>

              <View style={s.quickRow}>
                {ACOES_RAPIDAS.map((a) => (
                  <Toque
                    key={a.action}
                    style={s.quickCard}
                    onPress={() => handleQuickAction(a.action)}
                    reduceMotion={reduceMotion}
                  >
                    <View style={s.quickIcon}>
                      <Ionicons name={a.icon} size={19} color={c.accentLight} />
                    </View>
                    <Text style={s.quickTitle}>{a.title}</Text>
                    <Text style={s.quickSubtitle}>{a.subtitle}</Text>
                  </Toque>
                ))}

                <Toque
                  style={[s.quickCard, s.quickCardDestaque]}
                  onPress={() => {
                    setShowQuickActions(false);
                    setShowTriage(true);
                  }}
                  reduceMotion={reduceMotion}
                >
                  <View style={s.quickIcon}>
                    <Ionicons name="pulse-outline" size={19} color={c.accentLight} />
                  </View>
                  <Text style={s.quickTitle}>Triagem</Text>
                  <Text style={s.quickSubtitle}>Avaliar sintoma</Text>
                </Toque>

                <Toque
                  style={s.quickCard}
                  onPress={() => handleEnviarFoto("camera")}
                  reduceMotion={reduceMotion}
                  disabled={enviandoFoto}
                >
                  <View style={s.quickIcon}>
                    <Ionicons name="camera-outline" size={19} color={c.accentLight} />
                  </View>
                  <Text style={s.quickTitle}>Tirar foto</Text>
                  <Text style={s.quickSubtitle}>Avaliação visual</Text>
                </Toque>

                <Toque
                  style={s.quickCard}
                  onPress={() => handleEnviarFoto("galeria")}
                  reduceMotion={reduceMotion}
                  disabled={enviandoFoto}
                >
                  <View style={s.quickIcon}>
                    <Ionicons name="images-outline" size={19} color={c.accentLight} />
                  </View>
                  <Text style={s.quickTitle}>Da galeria</Text>
                  <Text style={s.quickSubtitle}>Avaliação visual</Text>
                </Toque>
              </View>
            </View>
          </View>
        )}

        {/* PAINEL: TRIAGEM */}
        {showTriage && (
          <Animated.View
            style={[
              s.painel,
              {
                opacity: triageAnim,
                transform: [
                  {
                    translateY: triageAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={s.painelInner}>
              <View style={s.painelHeader}>
                <View style={s.triageTitleRow}>
                  <View style={s.triagePulse}>
                    <Ionicons name="pulse" size={16} color={c.white} />
                  </View>
                  <View>
                    <Text style={s.painelTitle}>Triagem</Text>
                    <Text style={s.painelSubtitle}>
                      O que está acontecendo com o pet?
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={s.drawerIconBtn}
                  hitSlop={10}
                  onPress={() => setShowTriage(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar triagem"
                >
                  <Ionicons name="close" size={18} color={c.textSecondary} />
                </Pressable>
              </View>

              <View style={s.triageGrid}>
                {SINTOMAS.map((sintoma) => (
                  <Toque
                    key={sintoma.termo}
                    style={s.triageItem}
                    contentStyle={s.toqueRowConteudo}
                    onPress={() => handleTriage(sintoma.termo)}
                    reduceMotion={reduceMotion}
                  >
                    <Ionicons name={sintoma.icon} size={20} color={c.accentLight} />
                    <Text style={s.triageItemText}>{sintoma.label}</Text>
                  </Toque>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* BANNER DE URGÊNCIA */}
        {urgente && lastResult && (
          <View
            style={[s.banner, emergencia ? s.bannerCritico : s.bannerAlerta]}
            accessibilityRole="alert"
          >
            <View style={s.bannerInner}>
              <View style={s.bannerIcon}>
                <Ionicons
                  name={emergencia ? "warning" : "alert-circle"}
                  size={19}
                  color={c.white}
                />
              </View>
              <View style={s.bannerContent}>
                <Text style={s.bannerTitle}>
                  {emergencia ? "Procure um veterinário agora" : "Avalie nas próximas horas"}
                </Text>
                <Text style={s.bannerText}>
                  {emergencia
                    ? "O relato indica uma situação que pede atendimento imediato."
                    : "Vale marcar uma consulta nas próximas 24 a 48 horas."}
                </Text>
              </View>
              <Pressable
                style={s.bannerAction}
                hitSlop={8}
                onPress={() =>
                  showAlert(
                    "Atendimento veterinário",
                    "Procure uma clínica de confiança ou o serviço de emergência da sua região.",
                    [{ text: "Entendi" }],
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Mais informações"
              >
                <Ionicons name="information-circle-outline" size={19} color={c.white} />
              </Pressable>
            </View>
          </View>
        )}

        {/* LISTA DE MENSAGENS */}
        <View style={s.chatContainer}>
          <FlatList
            ref={listRef}
            data={messages as ChatMessage[]}
            keyExtractor={(_, i) => `msg-${i}`}
            renderItem={renderItem}
            extraData={[streamedText, feedbacks, lastResult, s]}
            contentContainerStyle={s.messagesList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onScroll={aoRolar}
            scrollEventThrottle={16}
            onContentSizeChange={aoMudarTamanho}
            onScrollToIndexFailed={aoFalharScrollBusca}
            ListHeaderComponent={messages.length === 0 ? boasVindas : null}
            ListFooterComponent={rodapeLista}
            removeClippedSubviews={Platform.OS === "android"}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={11}
          />

          <Animated.View
            style={[
              s.scrollButtonWrap,
              {
                opacity: scrollBtnAnim,
                transform: [{ scale: scrollBtnAnim }],
              },
            ]}
            pointerEvents={showScrollButton ? "auto" : "none"}
          >
            <Pressable
              style={({ pressed }) => [s.scrollButton, pressed && s.pressed]}
              onPress={() => irParaOFim(true)}
              accessibilityRole="button"
              accessibilityLabel="Ir para a última mensagem"
            >
              <Ionicons name="arrow-down" size={18} color={c.white} />
            </Pressable>
          </Animated.View>
        </View>

        {/* BARRA DE ENTRADA */}
        <View style={s.inputBar}>
          <View style={s.inputBarInner}>
            {voz.gravando ? (
              <>
                <Pressable
                  style={({ pressed }) => [s.gravacaoCancelar, pressed && s.pressed]}
                  onPress={handleCancelarGravacao}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar gravação"
                >
                  <Ionicons name="trash-outline" size={20} color={c.accentRed} />
                </Pressable>

                <View style={s.gravacaoInfo}>
                  <Animated.View
                    style={[s.gravacaoDot, { opacity: gravacaoPulse }]}
                  />
                  <Text style={s.gravacaoTempo}>
                    {formatarTempoAudio(voz.duracaoMs / 1000)}
                  </Text>
                  <View style={s.gravacaoNivelWrap}>
                    {NIVEL_MULTIPLICADORES.map((mult, i) => (
                      <View
                        key={i}
                        style={[
                          s.gravacaoNivelBarra,
                          { height: 4 + voz.nivel * mult * 16 },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [s.sendButton, pressed && s.pressed]}
                  onPress={handleMicPress}
                  disabled={voz.transcrevendo}
                  accessibilityRole="button"
                  accessibilityLabel="Parar gravação e enviar"
                >
                  {voz.transcrevendo ? (
                    <ActivityIndicator size="small" color={c.white} />
                  ) : (
                    <Ionicons name="checkmark" size={22} color={c.white} />
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [s.plusButton, pressed && s.pressed]}
                  onPress={() => setShowQuickActions((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Atalhos"
                >
                  <Ionicons
                    name={showQuickActions ? "close" : "add"}
                    size={22}
                    color={c.accentLight}
                  />
                </Pressable>

                <View
                  style={[s.inputContainer, inputFocado && s.inputContainerFocado]}
                >
                  <TextInput
                    style={[
                      s.input,
                      { height: Math.min(Math.max(22, alturaInput), r.sp(96)) },
                    ]}
                    placeholder="Pergunte ao Clyvo"
                    placeholderTextColor={c.textSecondary}
                    value={input}
                    onChangeText={setInput}
                    onContentSizeChange={(e) =>
                      setAlturaInput(e.nativeEvent.contentSize.height)
                    }
                    multiline
                    maxLength={LIMITE_CARACTERES}
                    blurOnSubmit={false}
                    onFocus={() => setInputFocado(true)}
                    onBlur={() => setInputFocado(false)}
                    accessibilityLabel="Mensagem"
                  />

                  {input.length > LIMITE_CARACTERES * 0.8 && (
                    <Text style={s.characterCount}>
                      {input.length}/{LIMITE_CARACTERES}
                    </Text>
                  )}
                </View>

                {!podeEnviar && !sending ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [s.cameraButton, pressed && s.pressed]}
                      onPress={() => handleEnviarFoto("camera")}
                      disabled={enviandoFoto}
                      accessibilityRole="button"
                      accessibilityLabel="Tirar foto do pet"
                    >
                      {enviandoFoto ? (
                        <ActivityIndicator size="small" color={c.accentLight} />
                      ) : (
                        <Ionicons name="camera-outline" size={21} color={c.accentLight} />
                      )}
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [s.sendButton, pressed && s.pressed]}
                      onPress={handleMicPress}
                      disabled={voz.transcrevendo}
                      accessibilityRole="button"
                      accessibilityLabel="Falar mensagem por voz"
                    >
                      {voz.transcrevendo ? (
                        <ActivityIndicator size="small" color={c.white} />
                      ) : (
                        <Ionicons name="mic-outline" size={21} color={c.white} />
                      )}
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      s.sendButton,
                      !podeEnviar && s.sendButtonDisabled,
                      pressed && podeEnviar && s.pressed,
                    ]}
                    onPress={() => handleSend()}
                    disabled={!podeEnviar}
                    accessibilityRole="button"
                    accessibilityLabel="Enviar mensagem"
                    accessibilityState={{ disabled: !podeEnviar }}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={c.white} />
                    ) : (
                      <Ionicons name="arrow-up" size={21} color={c.white} />
                    )}
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ---------- PAINEL FIXO DE NÚMEROS DO PET (desktop) ---------- */}
      {r.statsPanelWidth > 0 && (
        <View style={s.statsPanelFixo}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {painelNumerosPet}
          </ScrollView>
        </View>
      )}

      {/* ---------- MODAL: DETALHE DOS ALERTAS ---------- */}
      <Modal
        visible={showAlertsDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlertsDetail(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setShowAlertsDetail(false)}
        >
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={s.painelHeader}>
              <View>
                <Text style={s.painelTitle}>Alertas ativos</Text>
                <Text style={s.painelSubtitle}>
                  {pet ? `Do prontuário do ${pet.name}` : "Do prontuário"}
                </Text>
              </View>
              <Pressable
                style={s.drawerIconBtn}
                hitSlop={10}
                onPress={() => setShowAlertsDetail(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar alertas"
              >
                <Ionicons name="close" size={18} color={c.textSecondary} />
              </Pressable>
            </View>

            {risk && risk.alerts.length > 0 ? (
              <ScrollView style={s.modalScroll}>
                {risk.alerts.map((a) => (
                  <View
                    key={a.code + a.title}
                    style={[
                      s.alertChip,
                      { borderLeftColor: alertColor(a.severity) },
                    ]}
                  >
                    <Ionicons
                      name={alertIcon(a.severity)}
                      size={16}
                      color={alertColor(a.severity)}
                    />
                    <View style={s.alertChipContent}>
                      <Text style={s.alertChipTitle}>{a.title}</Text>
                      <Text style={s.alertChipDetail}>{a.detail}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={s.modalVazio}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={c.accentGreen}
                />
                <Text style={s.modalVazioTexto}>
                  Nenhum alerta ativo no momento.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- MODAL: DETALHE DO RISCO ---------- */}
      <Modal
        visible={showRiskDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRiskDetail(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setShowRiskDetail(false)}
        >
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={s.painelHeader}>
              <View>
                <Text style={s.painelTitle}>Risco atual</Text>
                <Text style={s.painelSubtitle}>
                  {pet ? `Avaliação de ${pet.name}` : "Avaliação"}
                </Text>
              </View>
              <Pressable
                style={s.drawerIconBtn}
                hitSlop={10}
                onPress={() => setShowRiskDetail(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar detalhe do risco"
              >
                <Ionicons name="close" size={18} color={c.textSecondary} />
              </Pressable>
            </View>

            <View style={s.riskDetailScoreRow}>
              <Text style={[s.riskDetailScoreNumero, { color: riskCor }]}>
                {risk?.riskScore ?? 0}
              </Text>
              <View style={s.riskDetailScoreInfo}>
                <Text style={[s.riskDetailScoreLabel, { color: riskCor }]}>
                  Nível {risk?.riskLabel ?? "—"}
                </Text>
                <Text style={s.riskDetailScoreFaixa}>
                  0-29 baixo · 30-59 médio · 60-100 alto
                </Text>
              </View>
            </View>

            {risk && risk.alerts.length > 0 ? (
              <>
                <Text style={s.riskDetailFatoresTitulo}>
                  De onde vem esse número
                </Text>
                <ScrollView style={s.modalScroll}>
                  {[...risk.alerts]
                    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
                    .map((a) => (
                      <View key={a.code + a.title} style={s.riskFatorRow}>
                        <View
                          style={[
                            s.riskFatorPontos,
                            { backgroundColor: `${alertColor(a.severity)}22` },
                          ]}
                        >
                          <Text
                            style={[
                              s.riskFatorPontosTexto,
                              { color: alertColor(a.severity) },
                            ]}
                          >
                            +{a.points ?? 0}
                          </Text>
                        </View>
                        <View style={s.alertChipContent}>
                          <Text style={s.alertChipTitle}>{a.title}</Text>
                          <Text style={s.alertChipDetail}>{a.detail}</Text>
                        </View>
                      </View>
                    ))}
                </ScrollView>
              </>
            ) : (
              <View style={s.modalVazio}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={c.accentGreen}
                />
                <Text style={s.modalVazioTexto}>
                  Nenhum fator de risco identificado — por isso o nível está baixo.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- MODAL: FOTO EM TELA CHEIA ---------- */}
      <Modal
        visible={!!imagemAmpliada}
        transparent
        animationType="fade"
        onRequestClose={() => setImagemAmpliada(null)}
      >
        <Pressable
          style={s.fotoModalBackdrop}
          onPress={() => setImagemAmpliada(null)}
        >
          <Pressable
            style={s.fotoModalFechar}
            onPress={() => setImagemAmpliada(null)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fechar foto"
          >
            <Ionicons name="close" size={26} color={c.white} />
          </Pressable>

          {!!imagemAmpliada && (
            <FotoComFade
              uri={imagemAmpliada}
              style={s.fotoModalImagem}
              reduceMotion={reduceMotion}
            />
          )}
        </Pressable>
      </Modal>

      {/* ---------- DRAWER OVERLAY (celular / tablet em pé) ---------- */}
      {!sidebarFixa && drawerAberto && (
        <TouchableWithoutFeedback onPress={() => setDrawerAberto(false)}>
          <Animated.View style={[s.drawerBackdrop, { opacity: drawerAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {!sidebarFixa && (
        <Animated.View
          style={[
            s.drawerOverlay,
            {
              transform: [
                {
                  translateX: drawerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-r.drawerWidth - 24, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={drawerAberto ? "auto" : "none"}
        >
          {conteudoDrawer}
        </Animated.View>
      )}
    </View>
  );
}

/* ============================================================
   ESTILOS
============================================================ */

const makeStyles = (theme: Theme, r: Metrics) => {
  const c = theme.colors;
  const { overlay, tint, isDark } = theme;
  const { fs, sp, insets, gutter } = r;

  const drawerBg = isDark ? "#1B1C1F" : "#F2F5F9";
  const drawerTrack = isDark ? "#2B2D31" : "#E3E8EE";
  const drawerAtivo = isDark ? "#33363C" : "#D7E6FD";

  // Coluna de leitura centralizada — usada em todas as faixas
  // (header, painéis, lista, input) para tudo alinhar no mesmo eixo.
  const coluna = {
    width: "100%" as const,
    maxWidth: r.contentMaxWidth,
    alignSelf: "center" as const,
  };

  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: c.background,
    },
    mainColumn: { flex: 1, backgroundColor: c.background },
    pressed: { opacity: 0.7 },

    /* ---------- HEADER ---------- */
    header: {
      backgroundColor: c.primary,
      paddingTop: insets.top + sp(10),
      paddingBottom: sp(12),
      paddingHorizontal: gutter,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      zIndex: 10,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    headerGlowOne: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      right: -60,
      top: -120,
      backgroundColor: tint(0.18),
    },
    headerGlowTwo: {
      position: "absolute",
      width: 130,
      height: 130,
      borderRadius: 65,
      left: -80,
      top: -100,
      backgroundColor: tint(0.08),
    },
    headerButton: {
      minWidth: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    headerButtonGap: { marginLeft: sp(6) },

    avatarWrapper: {
      width: 46,
      height: 46,
      marginLeft: sp(8),
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
    petImage: { width: 36, height: 36, borderRadius: 18 },
    headerOnlineDot: {
      position: "absolute",
      width: 10,
      height: 10,
      borderRadius: 5,
      right: -1,
      bottom: -1,
      backgroundColor: c.accentGreen,
      borderWidth: 2,
      borderColor: c.primary,
    },

    headerInfo: { flex: 1, marginLeft: sp(10), minWidth: 0 },
    headerNameRow: { flexDirection: "row", alignItems: "center" },
    headerTitle: {
      color: c.white,
      fontSize: fs(17),
      fontWeight: "700",
      flexShrink: 1,
      letterSpacing: -0.2,
    },
    aiBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: sp(7),
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    aiBadgeText: {
      color: c.white,
      fontSize: fs(9),
      fontWeight: "700",
      marginLeft: 3,
    },
    onlineWrapper: { flexDirection: "row", alignItems: "center", marginTop: 3 },
    onlineDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.accentGreen,
      marginRight: 6,
    },
    onlineText: {
      color: "rgba(255,255,255,0.7)",
      fontSize: fs(11),
      fontWeight: "500",
    },
    riskWrapper: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    riskTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.18)",
      overflow: "hidden",
      flex: 1,
      maxWidth: r.isTablet ? 200 : 110,
    },
    riskFill: { height: 4, borderRadius: 2 },
    riskLabel: {
      fontSize: fs(10),
      fontWeight: "700",
      marginLeft: sp(8),
      flexShrink: 1,
    },

    /* ---------- SIDEBAR / DRAWER ---------- */
    sidebarFixa: {
      width: r.drawerWidth,
      backgroundColor: drawerBg,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: overlay(0.1),
    },
    drawerBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
      zIndex: 100,
    },
    drawerOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: r.drawerWidth,
      backgroundColor: drawerBg,
      zIndex: 101,
      borderTopRightRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 16,
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    drawerScroll: {
      paddingTop: insets.top + sp(12),
      paddingBottom: sp(110),
    },
    drawerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: sp(18),
      marginBottom: sp(18),
    },
    drawerLogoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    drawerLogoText: {
      color: c.text,
      fontSize: fs(18),
      fontWeight: "700",
      letterSpacing: -0.4,
    },
    drawerIconBtn: {
      minWidth: 36,
      minHeight: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    drawerSegmented: {
      flexDirection: "row",
      backgroundColor: drawerTrack,
      marginHorizontal: sp(16),
      borderRadius: 14,
      padding: 4,
      marginBottom: sp(16),
    },
    drawerSegmentBtn: {
      flex: 1,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      flexDirection: "row",
    },
    drawerSegmentBtnAtivo: {
      backgroundColor: isDark ? "#3A3D42" : "#FFFFFF",
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    drawerSegmentText: {
      color: c.textSecondary,
      fontSize: fs(13),
      fontWeight: "600",
    },
    drawerSegmentTextAtivo: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: "700",
    },
    betaBadge: {
      marginLeft: 6,
      backgroundColor: overlay(0.08),
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    betaBadgeText: {
      fontSize: fs(8),
      color: c.textSecondary,
      fontWeight: "700",
    },

    drawerBloco: { paddingHorizontal: sp(10), marginBottom: sp(14) },
    drawerSectionTitle: {
      color: c.textSecondary,
      fontSize: fs(12),
      fontWeight: "700",
      marginLeft: sp(12),
      marginBottom: sp(8),
    },
    drawerItem: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 46,
      paddingHorizontal: sp(12),
      borderRadius: 23,
      marginBottom: 2,
    },
    drawerItemAtivo: { backgroundColor: drawerAtivo },
    drawerItemIcon: { marginRight: sp(13) },
    drawerPetThumbBox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    drawerPetThumb: { width: 22, height: 22, borderRadius: 11 },
    drawerItemText: {
      color: c.textSecondary,
      fontSize: fs(14),
      fontWeight: "500",
      flex: 1,
    },
    drawerItemTextAtivo: { color: c.text, fontWeight: "700" },

    drawerFooter: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: drawerBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: overlay(0.1),
      paddingHorizontal: sp(18),
      paddingTop: sp(14),
      paddingBottom: Math.max(insets.bottom, sp(14)),
    },
    drawerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.accentLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: sp(12),
    },
    drawerAvatarText: { color: "#FFF", fontSize: fs(15), fontWeight: "700" },
    drawerPerfilInfo: { flex: 1 },
    drawerPerfilNome: { color: c.text, fontSize: fs(14), fontWeight: "600" },
    drawerPerfilPlano: {
      color: c.textSecondary,
      fontSize: fs(12),
      marginTop: 1,
    },

    /* ---------- PAINÉIS ---------- */
    painel: {
      backgroundColor: c.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: overlay(0.08),
      zIndex: 5,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    painelInner: {
      ...coluna,
      paddingHorizontal: gutter,
      paddingVertical: sp(14),
    },
    painelHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: sp(12),
    },
    painelTitle: { color: c.text, fontSize: fs(15), fontWeight: "700" },
    painelSubtitle: {
      color: c.textSecondary,
      fontSize: fs(12),
      marginTop: 2,
    },

    buscaRow: { flexDirection: "row", alignItems: "center", gap: sp(6) },
    buscaInput: {
      flex: 1,
      color: c.text,
      fontSize: fs(14),
      paddingVertical: sp(6),
    },
    buscaContagem: {
      color: c.textSecondary,
      fontSize: fs(12),
      fontWeight: "600",
      marginRight: 2,
    },

    quickRow: { flexDirection: "row", flexWrap: "wrap", gap: sp(8) },
    quickCard: {
      flexGrow: 1,
      flexBasis: r.isTablet ? "22%" : "47%",
      minHeight: 96,
      borderRadius: 16,
      padding: sp(12),
      backgroundColor: tint(0.07),
      borderWidth: 1,
      borderColor: tint(0.14),
    },
    quickCardDestaque: { backgroundColor: tint(0.1) },
    quickIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.13),
    },
    quickTitle: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: "700",
      marginTop: sp(9),
    },
    quickSubtitle: { color: c.textSecondary, fontSize: fs(11), marginTop: 2 },

    triageTitleRow: { flexDirection: "row", alignItems: "center", gap: sp(10) },
    triagePulse: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
    },
    triageGrid: { flexDirection: "row", flexWrap: "wrap", gap: sp(8) },
    triageItem: {
      width:
        r.triageColumns === 4
          ? `${100 / 4 - 2}%`
          : `${100 / 2 - 2}%`,
      minHeight: 62,
      borderRadius: 14,
      paddingHorizontal: sp(12),
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: tint(0.06),
      borderWidth: 1,
      borderColor: tint(0.12),
    },
    triageItemText: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: "600",
      marginLeft: sp(8),
      flexShrink: 1,
    },

    /* ---------- BANNER ---------- */
    banner: { zIndex: 4 },
    bannerAlerta: { backgroundColor: isDark ? "#7A4A02" : "#A96504" },
    bannerCritico: { backgroundColor: isDark ? "#8C1B12" : "#B42318" },
    bannerInner: {
      ...coluna,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: gutter,
      paddingVertical: sp(12),
    },
    bannerIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    bannerContent: { flex: 1, marginHorizontal: sp(10) },
    bannerTitle: { color: c.white, fontSize: fs(13), fontWeight: "700" },
    bannerText: {
      color: "rgba(255,255,255,0.85)",
      fontSize: fs(12),
      marginTop: 2,
      lineHeight: fs(17),
    },
    bannerAction: {
      minWidth: 36,
      minHeight: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },

    /* ---------- LISTA ---------- */
    chatContainer: { flex: 1 },
    messagesList: {
      ...coluna,
      paddingHorizontal: gutter,
      paddingTop: sp(16),
      paddingBottom: sp(20),
    },

    /* ---------- BOAS-VINDAS ---------- */
    welcomeContainer: {
      alignItems: "center",
      paddingTop: sp(20),
      paddingBottom: sp(16),
    },
    heroArea: {
      width: 176,
      height: 156,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: sp(18),
    },
    heroGlowBackdrop: {
      position: "absolute",
      width: 176,
      height: 176,
      borderRadius: 88,
      backgroundColor: tint(0.28),
    },
    heroAvatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#0A1220" : c.card,
      borderWidth: 1.5,
      borderColor: tint(0.4),
      elevation: 10,
      shadowColor: c.accentLight,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.55 : 0.2,
      shadowRadius: 22,
    },
    heroPetImage: { width: 86, height: 86, borderRadius: 43 },
    heroOrbitOne: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 1,
      borderColor: tint(0.32),
    },
    heroOrbitTwo: {
      position: "absolute",
      width: 148,
      height: 148,
      borderRadius: 74,
      borderWidth: 1,
      borderColor: tint(0.16),
    },
    heroOrbitThree: {
      position: "absolute",
      width: 176,
      height: 176,
      borderRadius: 88,
      borderWidth: 1,
      borderColor: tint(0.07),
    },
    heroSparkle: {
      position: "absolute",
      right: 14,
      top: 10,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
      borderWidth: 2,
      borderColor: c.background,
    },
    welcomeTitle: {
      color: c.text,
      fontSize: fs(r.isTablet ? 32 : 26),
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: -0.6,
    },
    welcomeSubtitle: {
      color: c.textSecondary,
      fontSize: fs(14),
      lineHeight: fs(21),
      textAlign: "center",
      marginTop: sp(8),
      maxWidth: 420,
    },
    trustRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: sp(14),
    },
    trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    trustText: {
      color: c.textSecondary,
      fontSize: fs(11),
      fontWeight: "600",
    },
    trustDivider: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.textSecondary,
      opacity: 0.4,
      marginHorizontal: sp(10),
    },

    triageLaunch: {
      width: "100%",
      maxWidth: 520,
      flexDirection: "row",
      alignItems: "center",
      marginTop: sp(20),
      padding: sp(13),
      borderRadius: 18,
      backgroundColor: isDark ? c.secondary : c.primary,
      elevation: 4,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.2,
      shadowRadius: 12,
    },
    triageLaunchIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    triageLaunchContent: { flex: 1, marginHorizontal: sp(11) },
    triageLaunchTitle: { color: c.white, fontSize: fs(14), fontWeight: "700" },
    triageLaunchText: {
      color: "rgba(255,255,255,0.72)",
      fontSize: fs(11),
      marginTop: 2,
    },

    suggestionsContainer: { width: "100%", maxWidth: 620, marginTop: sp(26) },
    suggestionsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: sp(10),
    },
    suggestionsTitle: { color: c.text, fontSize: fs(15), fontWeight: "700" },
    suggestionsGrid: {
      flexDirection: r.isTablet ? "row" : "column",
      flexWrap: "wrap",
      gap: sp(9),
    },
    suggestionCard: {
      flexGrow: 1,
      flexBasis: r.isTablet ? "30%" : "100%",
      minHeight: 60,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 16,
      paddingHorizontal: sp(13),
      paddingVertical: sp(10),
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.05),
    },
    suggestionIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.1),
    },
    suggestionText: {
      flex: 1,
      color: c.text,
      fontSize: fs(13),
      lineHeight: fs(18),
      marginHorizontal: sp(10),
    },
    suggestionArrow: { opacity: 0.8 },

    /* ---------- MENSAGENS ---------- */
    messageRow: {
      width: "100%",
      flexDirection: "row",
      marginBottom: sp(16),
      alignItems: "flex-end",
    },
    messageRowUser: { justifyContent: "flex-end" },
    messageRowAi: { justifyContent: "flex-start" },
    messageAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentLight,
      marginRight: sp(8),
    },
    userAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? c.secondary : c.primary,
      marginLeft: sp(8),
    },
    messageContent: { maxWidth: r.bubbleMaxWidth, minWidth: 0 },
    messageContentUser: { alignItems: "flex-end" },
    messageContentAi: { alignItems: "flex-start" },
    messageLabel: {
      color: c.accentLight,
      fontSize: fs(11),
      fontWeight: "700",
      marginBottom: 4,
      marginLeft: 2,
    },
    messageLabelUser: {
      color: c.textSecondary,
      fontSize: fs(11),
      fontWeight: "600",
      marginBottom: 4,
      marginRight: 2,
    },
    userBubble: {
      backgroundColor: isDark ? c.secondary : c.primary,
      paddingHorizontal: sp(15),
      paddingVertical: sp(11),
      borderRadius: 20,
      borderBottomRightRadius: 6,
    },
    aiBubble: {
      backgroundColor: c.card,
      paddingHorizontal: sp(15),
      paddingVertical: sp(11),
      borderRadius: 20,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.05),
    },
    userText: { color: c.white, fontSize: fs(15), lineHeight: fs(22) },
    mensagemStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
      gap: 3,
      marginTop: sp(4),
    },
    mensagemHorario: {
      color: "rgba(255,255,255,0.7)",
      fontSize: fs(10),
    },
    mensagemFotoThumb: {
      width: 220,
      height: 220,
      borderRadius: 14,
      backgroundColor: overlay(0.06),
    },
    mensagemHorarioAiTexto: {
      color: c.textSecondary,
      fontSize: fs(10),
      marginTop: sp(6),
      alignSelf: "flex-end",
    },
    aiText: { color: c.text, fontSize: fs(15), lineHeight: fs(23) },

    /* ---------- MENSAGEM DE VOZ ---------- */
    audioBubbleWrap: { minWidth: 168 },
    audioBubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: sp(8),
    },
    audioBubbleRodape: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: sp(5),
      paddingLeft: 40,
    },
    audioBubbleStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    audioBubbleHorario: {
      color: "rgba(255,255,255,0.7)",
      fontSize: fs(10),
    },
    audioBubbleHorarioAi: {
      color: c.textSecondary,
      fontSize: fs(10),
    },
    audioBubbleBotao: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },
    audioBubbleOnda: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      height: 20,
    },
    audioBubbleBarra: { width: 2.5, borderRadius: 2 },
    audioBubbleTempo: {
      color: "rgba(255,255,255,0.85)",
      fontSize: fs(11),
      fontWeight: "600",
      minWidth: 32,
    },
    audioTranscricaoToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: sp(8),
    },
    audioTranscricaoToggleTexto: {
      color: c.accentLight,
      fontSize: fs(11),
      fontWeight: "700",
    },
    audioTranscricaoTexto: { marginTop: sp(8) },
    messageActions: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    messageAction: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    triageTag: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 9,
      borderWidth: 1,
      marginBottom: sp(9),
    },
    triageTagText: { fontSize: fs(10), fontWeight: "700" },
    cursor: {
      width: 7,
      height: fs(15),
      marginTop: 4,
      borderRadius: 2,
      backgroundColor: c.accentLight,
      opacity: 0.75,
    },

    /* ---------- FONTES / ALERTAS / CTA ---------- */
    sourcesRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      marginLeft: 38,
      marginTop: -sp(6),
      marginBottom: sp(14),
    },
    sourceChip: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 9,
      backgroundColor: tint(0.08),
      borderWidth: 1,
      borderColor: tint(0.14),
      maxWidth: 170,
    },
    sourceChipText: {
      fontSize: fs(10),
      fontWeight: "600",
      color: c.textSecondary,
    },

    alertsBlock: { marginLeft: 38, marginBottom: sp(16) },
    alertsLabel: {
      color: c.textSecondary,
      fontSize: fs(11),
      fontWeight: "700",
      marginBottom: sp(8),
    },
    alertChip: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: c.card,
      borderRadius: 13,
      borderLeftWidth: 3,
      paddingVertical: sp(10),
      paddingHorizontal: sp(12),
      marginBottom: sp(7),
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.04),
    },
    alertChipContent: { flex: 1, marginLeft: sp(9) },
    alertChipTitle: { color: c.text, fontSize: fs(12), fontWeight: "700" },
    alertChipDetail: {
      color: c.textSecondary,
      fontSize: fs(11),
      lineHeight: fs(16),
      marginTop: 3,
    },

    cta: {
      alignSelf: "flex-start",
      maxWidth: r.bubbleMaxWidth + 40,
      marginLeft: 38,
      marginBottom: sp(16),
      padding: sp(13),
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: tint(0.2),
      flexDirection: "row",
      alignItems: "center",
    },
    ctaIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(0.1),
    },
    ctaContent: { flex: 1, marginHorizontal: sp(11) },
    ctaTitle: { color: c.text, fontSize: fs(14), fontWeight: "700" },
    ctaDescription: {
      color: c.textSecondary,
      fontSize: fs(11),
      marginTop: 2,
    },

    /* ---------- DIGITANDO ---------- */
    typingRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: sp(16),
    },
    skeletonBubble: {
      flex: 1,
      maxWidth: r.bubbleMaxWidth,
      paddingHorizontal: sp(15),
      paddingVertical: sp(13),
      borderRadius: 20,
      borderBottomLeftRadius: 6,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.04),
    },
    skeletonHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: sp(11),
    },
    skeletonLine: {
      height: 9,
      borderRadius: 5,
      marginBottom: 7,
      backgroundColor: c.textLight,
    },
    typingDots: { flexDirection: "row", alignItems: "center", gap: 4 },
    typingDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.accentLight,
    },
    typingText: {
      color: c.textSecondary,
      fontSize: fs(12),
      marginLeft: sp(9),
      flexShrink: 1,
    },

    /* ---------- BOTÃO DE ROLAGEM ---------- */
    scrollButtonWrap: {
      position: "absolute",
      right: gutter,
      bottom: sp(16),
    },
    scrollButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? c.secondary : c.primary,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },

    /* ---------- ENTRADA ---------- */
    inputBar: {
      backgroundColor: c.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: overlay(0.08),
      paddingBottom: Math.max(insets.bottom, sp(12)),
      paddingTop: sp(12),
    },
    inputBarInner: {
      ...coluna,
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: gutter,
    },
    plusButton: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: sp(8),
      backgroundColor: isDark ? overlay(0.06) : tint(0.07),
      borderWidth: 1,
      borderColor: isDark ? overlay(0.09) : tint(0.13),
    },
    cameraButton: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: sp(8),
      backgroundColor: isDark ? overlay(0.06) : tint(0.07),
      borderWidth: 1,
      borderColor: isDark ? overlay(0.09) : tint(0.13),
    },

    /* ---------- BARRA DE GRAVAÇÃO ---------- */
    gravacaoCancelar: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: sp(8),
      backgroundColor: isDark ? overlay(0.06) : `${c.accentRed}14`,
      borderWidth: 1,
      borderColor: isDark ? overlay(0.09) : `${c.accentRed}26`,
    },
    gravacaoInfo: {
      flex: 1,
      minHeight: 46,
      borderRadius: 23,
      backgroundColor: c.card,
      paddingHorizontal: sp(16),
      borderWidth: 1,
      borderColor: isDark ? overlay(0.14) : overlay(0.09),
      flexDirection: "row",
      alignItems: "center",
      gap: sp(9),
    },
    gravacaoDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: c.accentRed,
    },
    gravacaoTempo: {
      color: c.text,
      fontSize: fs(14),
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      minWidth: 34,
    },
    gravacaoNivelWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    gravacaoNivelBarra: {
      width: 3,
      borderRadius: 2,
      backgroundColor: c.accentLight,
    },
    inputContainer: {
      flex: 1,
      minHeight: 46,
      borderRadius: 23,
      backgroundColor: isDark ? "#0A1220" : c.card,
      paddingHorizontal: sp(16),
      paddingVertical: sp(11),
      borderWidth: 1,
      borderColor: isDark ? tint(0.22) : overlay(0.09),
      justifyContent: "center",
    },
    inputContainerFocado: {
      borderColor: c.accentLight,
      borderWidth: 1.5,
      shadowColor: c.accentLight,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.45 : 0,
      shadowRadius: 12,
      elevation: isDark ? 4 : 0,
    },
    input: {
      color: c.text,
      fontSize: fs(15),
      lineHeight: fs(21),
      padding: 0,
      textAlignVertical: "center",
    },
    characterCount: {
      fontSize: fs(10),
      color: c.textSecondary,
      alignSelf: "flex-end",
      marginTop: 4,
    },
    sendButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: sp(8),
      backgroundColor: isDark ? c.accent : c.primary,
      elevation: 6,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    sendButtonDisabled: {
      backgroundColor: isDark ? "#283750" : "#D9DEE6",
      elevation: 0,
      shadowOpacity: 0,
    },
    micButtonGravando: {
      backgroundColor: c.accentRed,
      shadowColor: c.accentRed,
    },
    toqueFillRow: { flex: 1 },
    toqueFillColumn: { flex: 1 },
    toqueRowConteudo: { flex: 1, flexDirection: "row", alignItems: "center" },

    /* ---------- PAINEL: NÚMEROS DO PET ---------- */
    statsPanelFixo: {
      width: r.statsPanelWidth,
      backgroundColor: drawerBg,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: overlay(0.1),
      paddingTop: insets.top + sp(16),
      paddingBottom: sp(16),
    },
    statsPanelInner: { paddingHorizontal: sp(16) },
    statsPanelHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: sp(14),
    },
    statsPanelTitle: {
      color: c.text,
      fontSize: fs(15),
      fontWeight: "700",
    },
    statsPanelSubtitle: {
      color: c.textSecondary,
      fontSize: fs(11),
      marginTop: 2,
    },
    statsPanelInfoRow: {
      flexDirection: "row",
      backgroundColor: tint(0.06),
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tint(0.12),
      paddingVertical: sp(10),
      marginBottom: sp(14),
    },
    statsPanelInfoItem: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 4,
    },
    statsPanelInfoLabel: {
      color: c.textSecondary,
      fontSize: fs(10),
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    statsPanelInfoValue: {
      color: c.text,
      fontSize: fs(13),
      fontWeight: "700",
      marginTop: 3,
    },
    statsCardsWrap: { gap: sp(10) },
    statCard: {
      flexDirection: "row",
      backgroundColor: c.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? c.border : overlay(0.05),
    },
    statCardAccent: { width: 4 },
    statCardBody: {
      flex: 1,
      paddingVertical: sp(11),
      paddingHorizontal: sp(13),
    },
    statCardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    statCardLabel: {
      color: c.textSecondary,
      fontSize: fs(10),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      flexShrink: 1,
    },
    statCardValue: {
      fontSize: fs(27),
      fontWeight: "800",
      letterSpacing: -0.8,
      marginTop: sp(3),
    },
    statCardSub: {
      color: c.textSecondary,
      fontSize: fs(11),
      marginTop: 3,
    },
    statCardUnidade: {
      fontSize: fs(13),
      fontWeight: "600",
    },

    /* ---------- COLEIRA (POC / dados mockados) ---------- */
    colarSecao: { marginTop: sp(18) },
    colarTituloRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: sp(8),
    },
    colarTitulo: {
      color: c.textSecondary,
      fontSize: fs(10),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },

    /* ---------- MODAL: DETALHE DOS ALERTAS ---------- */
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: sp(20),
    },
    modalCard: {
      width: "100%",
      maxWidth: 440,
      maxHeight: "80%",
      backgroundColor: c.card,
      borderRadius: 20,
      padding: sp(16),
      elevation: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    modalScroll: { marginTop: sp(4) },
    riskDetailScoreRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: sp(14),
      marginBottom: sp(16),
      paddingBottom: sp(16),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? c.border : overlay(0.08),
    },
    riskDetailScoreNumero: {
      fontSize: fs(40),
      fontWeight: "800",
      letterSpacing: -1,
    },
    riskDetailScoreInfo: { flex: 1 },
    riskDetailScoreLabel: {
      fontSize: fs(15),
      fontWeight: "700",
      textTransform: "capitalize",
    },
    riskDetailScoreFaixa: {
      color: c.textSecondary,
      fontSize: fs(11),
      marginTop: 3,
    },
    riskDetailFatoresTitulo: {
      color: c.textSecondary,
      fontSize: fs(11),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: sp(8),
    },
    riskFatorRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: sp(10),
      marginBottom: sp(10),
    },
    riskFatorPontos: {
      minWidth: 42,
      height: 24,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    riskFatorPontosTexto: { fontSize: fs(11), fontWeight: "800" },
    modalVazio: {
      alignItems: "center",
      paddingVertical: sp(28),
      gap: 8,
    },
    modalVazioTexto: {
      color: c.textSecondary,
      fontSize: fs(13),
      fontWeight: "600",
    },

    /* ---------- MODAL: FOTO EM TELA CHEIA ---------- */
    fotoModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.92)",
      alignItems: "center",
      justifyContent: "center",
      padding: sp(20),
    },
    fotoModalFechar: {
      position: "absolute",
      top: insets.top + sp(14),
      right: sp(18),
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.14)",
      zIndex: 1,
    },
    fotoModalImagem: {
      width: "100%",
      height: "80%",
      resizeMode: "contain",
    },
  });
};
