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

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estado = useAudioRecorderState(recorder);

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
  }> => {
    if (!recorder.isRecording) return { texto: null, erro: null };

    await recorder.stop();
    const uri = recorder.uri;

    if (!uri) {
      const msg = "Não foi possível capturar o áudio gravado.";
      setErro(msg);
      return { texto: null, erro: msg };
    }

    setTranscrevendo(true);
    try {
      const texto = await aiService.transcribe(uri);
      return { texto: texto.trim() || null, erro: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao transcrever o áudio.";
      setErro(msg);
      return { texto: null, erro: msg };
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
    transcrevendo,
    erro,
    iniciar,
    parar,
    cancelar,
  };
}
