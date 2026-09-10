// useSpeechOutput.ts
//
// Lê em voz alta as respostas do assistente. Tenta primeiro a voz
// personalizada (ElevenLabs, via backend); se o backend não tiver TTS
// configurado ou a chamada falhar, cai para a voz nativa do
// dispositivo/navegador (expo-speech), pra nunca ficar mudo.
//
// Quando a voz personalizada funciona, `falar()` devolve a URI do áudio
// gerado — a tela guarda essa URI na própria mensagem, pra virar uma
// "nota de voz" replayável (igual à mensagem que o tutor manda por voz),
// em vez de precisar sintetizar de novo a cada replay.

import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { aiService } from "../services/AiService";

const TAG_HTML = /<[^>]+>/g;

function limparParaFala(texto: string): string {
  return texto
    .replace(TAG_HTML, " ")
    .replace(/[*_#`]/g, "")
    .trim();
}

export type ResultadoFala = { uri: string | null };

export function useSpeechOutput() {
  const [vozAtiva, setVozAtiva] = useState(true);
  const [falando, setFalando] = useState(false);

  const playerRef = useRef<AudioPlayer | null>(null);

  const pararFala = useCallback(() => {
    Speech.stop();
    if (playerRef.current) {
      try {
        playerRef.current.remove();
      } catch {
        /* já pode ter sido liberado */
      }
      playerRef.current = null;
    }
    setFalando(false);
  }, []);

  const falarComVozDoDispositivo = useCallback((texto: string) => {
    Speech.speak(texto, {
      language: "pt-BR",
      onDone: () => setFalando(false),
      onStopped: () => setFalando(false),
      onError: () => setFalando(false),
    });
  }, []);

  const falar = useCallback(
    async (texto: string): Promise<ResultadoFala> => {
      if (!vozAtiva) return { uri: null };

      const limpo = limparParaFala(texto);
      if (!limpo) return { uri: null };

      pararFala();
      setFalando(true);

      try {
        const resposta = await fetch(aiService.speechSynthesisUrl(limpo));
        if (!resposta.ok) {
          const detalhe = await resposta.text().catch(() => "");
          throw new Error(`TTS respondeu ${resposta.status}: ${detalhe}`);
        }

        let uri: string;

        if (Platform.OS === "web") {
          const blob = await resposta.blob();
          uri = URL.createObjectURL(blob);
        } else {
          const bytes = new Uint8Array(await resposta.arrayBuffer());
          // Não guardamos referência pra apagar depois: esse arquivo vira
          // o áudio permanente da mensagem (replay não deve exigir apagar
          // e regravar). É um cache efêmero — o SO pode limpá-lo eventualmente.
          const arquivo = new File(Paths.cache, `clyvo-tts-${Date.now()}.mp3`);
          arquivo.create();
          arquivo.write(bytes);
          uri = arquivo.uri;
        }

        const player = createAudioPlayer(uri);
        playerRef.current = player;

        player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            setFalando(false);
          }
        });

        player.play();
        return { uri };
      } catch (e) {
        // Backend sem ElevenLabs configurado, cota estourada, sem internet,
        // etc. Não deixa o tutor sem resposta em voz: usa a voz do aparelho.
        // (Sem URI reaproveitável — a voz do sistema não gera um arquivo.)
        console.warn("CLYVO TTS: caiu para voz do aparelho —", e);
        falarComVozDoDispositivo(limpo);
        return { uri: null };
      }
    },
    [vozAtiva, pararFala, falarComVozDoDispositivo],
  );

  const alternarVoz = useCallback(() => {
    setVozAtiva((atual) => {
      if (atual) pararFala();
      return !atual;
    });
  }, [pararFala]);

  return {
    vozAtiva,
    falando,
    falar,
    pararFala,
    alternarVoz,
  };
}
