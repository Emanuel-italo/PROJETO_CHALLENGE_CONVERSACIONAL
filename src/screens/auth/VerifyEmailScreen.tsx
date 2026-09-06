import React, { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { showAlert } from "../../utils/showAlert";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../styles/colors";
import { useAuth } from "../../hooks/useAuth";
import { mapFirebaseAuthError } from "../../utils/authErrors";

import { styles } from "../../styles/LoginScreen.styles";

export default function VerifyEmailScreen() {
  const { user, logout, sendVerificationEmail, refreshEmailVerified } =
    useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const handleCheckVerification = async () => {
    setChecking(true);

    try {
      const verified = await refreshEmailVerified();

      if (!verified) {
        showAlert(
          "Ainda não confirmado",
          "Não encontramos a confirmação do seu e-mail. Verifique sua caixa de entrada e clique no link antes de continuar.",
        );
      }
    } catch (error: any) {
      showAlert("Erro", mapFirebaseAuthError(error?.code));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      await sendVerificationEmail();

      showAlert(
        "E-mail reenviado",
        "Enviamos um novo link de confirmação para o seu e-mail.",
      );
    } catch (error: any) {
      showAlert("Erro", mapFirebaseAuthError(error?.code));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.orb} />
          <View style={styles.orbBottom} />

          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Ionicons name="paw" size={14} color={Colors.accentLight} />

              <Text style={styles.logo}>CLYVO VET</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />

              <Text style={styles.badgeText}>VERIFICAÇÃO</Text>
            </View>
          </View>

          <Text style={styles.title}>Confirme seu{"\n"}e-mail 📧</Text>

          <Text style={styles.sub}>
            Enviamos um link de confirmação para {user?.email ?? "o seu e-mail"}
            . Abra o link e depois toque em "Já confirmei" para continuar.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnPrimary, checking && { opacity: 0.6 }]}
              onPress={handleCheckVerification}
              disabled={checking}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>
                {checking ? "Verificando..." : "Já confirmei"}
              </Text>

              {!checking && (
                <View style={styles.btnArrow}>
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={Colors.accentLight}
                  />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSecondary, resending && { opacity: 0.6 }]}
              onPress={handleResend}
              disabled={resending}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>
                {resending ? "Enviando..." : "Reenviar e-mail"}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={logout}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
