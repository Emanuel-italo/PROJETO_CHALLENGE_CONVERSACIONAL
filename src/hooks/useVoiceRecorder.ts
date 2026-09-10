// useVoiceRecorder.ts
//
// Grava áudio do microfone (expo-audio) e envia para o backend
// (/api/speech/transcribe) para virar texto.

import { useCallback, useState } from "react";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { aiService } from "../services/AiService";

const OPCOES_GRAVACAO = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(OPCOES_GRAVACAO);
  // Intervalo curto (100ms) pra medição de volume e cronômetro ficarem fluidos.
  const estado = useAudioRecorderState(recorder, 100);

  // metering vem em dBFS (~-160 silêncio a 0 pico). Normaliza pra 0..1
  // só pra desenhar a barra — não é uma medida precisa, é só visual.
  const nivel = Math.min(
    1,
    Math.max(0, ((estado.metering ?? -60) + 60) / 60),
  );

  const [transcrevendo, setTranscrevendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const iniciar = useCallback(async (): Promise<{
    ok: boolean;
    erro: string | null;
  }> => {
    setErro(null);

    const permissao = await requestRecordingPermissionsAsync();
    if (!permissao.granted) {
      const msg = "Permissão de microfone negada.";
      setErro(msg);
      return { ok: false, erro: msg };
    }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    return { ok: true, erro: null };
  }, [recorder]);

  const parar = useCallback(async (): Promise<{
    texto: string | null;
    erro: string | null;
    uri: string | null;
    duracao: number;
  }> => {
    if (!recorder.isRecording) {
      return { texto: null, erro: null, uri: null, duracao: 0 };
    }

    const duracao = recorder.currentTime;
    await recorder.stop();
    const uri = recorder.uri;

    if (!uri) {
      const msg = "Não foi possível capturar o áudio gravado.";
      setErro(msg);
      return { texto: null, erro: msg, uri: null, duracao: 0 };
    }

    setTranscrevendo(true);
    try {
      const texto = await aiService.transcribe(uri);
      return { texto: texto.trim() || null, erro: null, uri, duracao };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao transcrever o áudio.";
      setErro(msg);
      return { texto: null, erro: msg, uri, duracao };
    } finally {
      setTranscrevendo(false);
    }
  }, [recorder]);

  const cancelar = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.stop();
    }
  }, [recorder]);

  return {
    gravando: estado.isRecording,
    duracaoMs: estado.durationMillis,
    nivel,
    transcrevendo,
    erro,
    iniciar,
    parar,
    cancelar,
  };
}
