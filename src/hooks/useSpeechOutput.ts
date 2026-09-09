// useSpeechOutput.ts
//
// Lê em voz alta as respostas do assistente. Tenta primeiro a voz
// personalizada (ElevenLabs, via backend); se o backend não tiver TTS
// configurado ou a chamada falhar, cai para a voz nativa do
// dispositivo/navegador (expo-speech), pra nunca ficar mudo.

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

export function useSpeechOutput() {
  const [vozAtiva, setVozAtiva] = useState(true);
  const [falando, setFalando] = useState(false);

  const playerRef = useRef<AudioPlayer | null>(null);
  const arquivoTempRef = useRef<File | null>(null);

  const limparPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.remove();
      } catch {
        /* já pode ter sido liberado */
      }
      playerRef.current = null;
    }

    if (arquivoTempRef.current) {
      try {
        arquivoTempRef.current.delete();
      } catch {
        /* arquivo temporário, tanto faz se falhar */
      }
      arquivoTempRef.current = null;
    }
  }, []);

  const pararFala = useCallback(() => {
    Speech.stop();
    limparPlayer();
    setFalando(false);
  }, [limparPlayer]);

  const falarComVozDoDispositivo = useCallback((texto: string) => {
    Speech.speak(texto, {
      language: "pt-BR",
      onDone: () => setFalando(false),
      onStopped: () => setFalando(false),
      onError: () => setFalando(false),
    });
  }, []);

  const falar = useCallback(
    async (texto: string) => {
      if (!vozAtiva) return;

      const limpo = limparParaFala(texto);
      if (!limpo) return;

      pararFala();
      setFalando(true);

      try {
        const resposta = await fetch(aiService.speechSynthesisUrl(limpo));
        if (!resposta.ok) {
          throw new Error(`TTS respondeu ${resposta.status}`);
        }

        let uri: string;

        if (Platform.OS === "web") {
          const blob = await resposta.blob();
          uri = URL.createObjectURL(blob);
        } else {
          const bytes = new Uint8Array(await resposta.arrayBuffer());
          const arquivo = new File(Paths.cache, `clyvo-tts-${Date.now()}.mp3`);
          arquivo.create();
          arquivo.write(bytes);
          arquivoTempRef.current = arquivo;
          uri = arquivo.uri;
        }

        const player = createAudioPlayer(uri);
        playerRef.current = player;

        player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            setFalando(false);
            limparPlayer();
          }
        });

        player.play();
      } catch {
        // Backend sem ElevenLabs configurado, sem internet, etc.
        // Não deixa o tutor sem resposta em voz: usa a voz do aparelho.
        falarComVozDoDispositivo(limpo);
      }
    },
    [vozAtiva, pararFala, limparPlayer, falarComVozDoDispositivo],
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
