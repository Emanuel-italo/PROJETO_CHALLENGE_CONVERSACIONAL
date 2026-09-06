import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";

import {
  GOOGLE_WEB_CLIENT_ID,
  isGoogleAuthConfigured,
} from "../config/googleAuth";
import { useAuth } from "./useAuth";

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // Sem Client ID nativo (iOS/Android) cadastrado, cai de volta pro Web
    // Client ID em qualquer plataforma — funciona porque pedimos o
    // "id_token" (fluxo implícito), que não exige client secret.
    clientId: GOOGLE_WEB_CLIENT_ID,
    responseType: "id_token",
  });

  useEffect(() => {
    if (response?.type !== "success") return;

    const idToken =
      response.authentication?.idToken ??
      (response.params as { id_token?: string })?.id_token;

    if (!idToken) return;

    setLoading(true);

    loginWithGoogle(idToken).finally(() => {
      setLoading(false);
    });
  }, [response]);

  const promptGoogleSignIn = () => {
    if (!isGoogleAuthConfigured) {
      return Promise.reject(
        new Error(
          "Login com Google ainda não configurado: defina GOOGLE_WEB_CLIENT_ID em src/config/googleAuth.ts.",
        ),
      );
    }

    return promptAsync();
  };

  return {
    promptGoogleSignIn,
    isReady: !!request,
    loading,
  };
}
