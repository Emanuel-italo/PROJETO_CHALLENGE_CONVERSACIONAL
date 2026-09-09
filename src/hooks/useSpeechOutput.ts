// useSpeechOutput.ts
//
// Lê em voz alta as respostas do assistente usando a engine de
// texto-para-voz do próprio dispositivo/navegador (expo-speech).

import { useCallback, useRef, useState } from "react";
import * as Speech from "expo-speech";

const ULTIMA_TAG_HTML = /<[^>]+>/g;

function limparParaFala(texto: string): string {
  return texto
    .replace(ULTIMA_TAG_HTML, " ")
    .replace(/[*_#`]/g, "")
    .trim();
}

export function useSpeechOutput() {
  const [vozAtiva, setVozAtiva] = useState(true);
  const [falando, setFalando] = useState(false);
  const ultimoIndiceFaladoRef = useRef(-1);

  const falar = useCallback(
    (texto: string) => {
      if (!vozAtiva || !texto.trim()) return;

      Speech.stop();
      setFalando(true);
      Speech.speak(limparParaFala(texto), {
        language: "pt-BR",
        onDone: () => setFalando(false),
        onStopped: () => setFalando(false),
        onError: () => setFalando(false),
      });
    },
    [vozAtiva],
  );

  const pararFala = useCallback(() => {
    Speech.stop();
    setFalando(false);
  }, []);

  const alternarVoz = useCallback(() => {
    setVozAtiva((atual) => {
      if (atual) Speech.stop();
      return !atual;
    });
    setFalando(false);
  }, []);

  return {
    vozAtiva,
    falando,
    falar,
    pararFala,
    alternarVoz,
    ultimoIndiceFaladoRef,
  };
}
