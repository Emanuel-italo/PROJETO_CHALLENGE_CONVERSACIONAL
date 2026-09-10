// useImagePicker.ts
//
// Câmera e galeria pra mandar uma foto do pet ao Clyvo (pré-avaliação
// visual). Comprime a imagem na captura pra não pesar o upload.

import { useCallback } from "react";
import type { ImagePickerResult } from "expo-image-picker";
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";

export type FotoSelecionada = {
  /** URI local, pra exibir a miniatura na bolha da mensagem. */
  uri: string;
  /** Data URI (data:image/jpeg;base64,...), pronta pra mandar ao backend. */
  base64: string;
};

type ResultadoEscolha = { foto: FotoSelecionada | null; erro: string | null };

function extrairFoto(resultado: ImagePickerResult): FotoSelecionada | null {
  if (resultado.canceled || !resultado.assets?.length) return null;

  const asset = resultado.assets[0];
  if (!asset.base64) return null;

  return { uri: asset.uri, base64: `data:image/jpeg;base64,${asset.base64}` };
}

export function useImagePicker() {
  const tirarFoto = useCallback(async (): Promise<ResultadoEscolha> => {
    const permissao = await requestCameraPermissionsAsync();
    if (!permissao.granted) {
      return { foto: null, erro: "Permissão de câmera negada." };
    }

    const resultado = await launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
    });

    return { foto: extrairFoto(resultado), erro: null };
  }, []);

  const escolherDaGaleria = useCallback(async (): Promise<ResultadoEscolha> => {
    const permissao = await requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      return { foto: null, erro: "Permissão de galeria negada." };
    }

    const resultado = await launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
    });

    return { foto: extrairFoto(resultado), erro: null };
  }, []);

  return { tirarFoto, escolherDaGaleria };
}
