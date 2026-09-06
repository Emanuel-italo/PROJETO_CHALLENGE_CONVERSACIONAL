import React, { useState, useRef, useEffect } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native";

import { showAlert } from "../../utils/showAlert";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../../types";

import { Colors } from "../../styles/colors";

import { useAuth } from "../../hooks/useAuth";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { mapFirebaseAuthError } from "../../utils/authErrors";
import { validarCampoObrigatorio, validarEmail } from "../../utils/validators";

import InputField from "../../components/InputField";

import { styles } from "../../styles/LoginScreen.styles";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const { login, resetPassword } = useAuth();

  const {
    promptGoogleSignIn,
    isReady: googleReady,
    loading: googleLoading,
  } = useGoogleAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [resetLoading, setResetLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(30)).current;

  const cardAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    const e: Record<string, string> = {};

    if (!validarCampoObrigatorio(email)) {
      e.email = "E-mail obrigatório";
    } else if (!validarEmail(email)) {
      e.email = "E-mail inválido";
    }

    if (!validarCampoObrigatorio(password)) {
      e.password = "Senha obrigatória";
    }

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (error: any) {
      showAlert("Erro", mapFirebaseAuthError(error?.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showAlert(
        "Informe seu e-mail",
        "Digite seu e-mail no campo acima para receber o link de redefinição de senha.",
      );
      return;
    }

    setResetLoading(true);

    try {
      await resetPassword(email);

      showAlert(
        "E-mail enviado",
        "Enviamos um link para redefinir sua senha. Confira sua caixa de entrada (e o spam).",
      );
    } catch (error: any) {
      showAlert("Erro", mapFirebaseAuthError(error?.code));
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await promptGoogleSignIn();
    } catch (error: any) {
      showAlert(
        "Erro",
        error?.code
          ? mapFirebaseAuthError(error.code)
          : (error?.message ?? mapFirebaseAuthError(undefined)),
      );
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.orb} />

          <View style={styles.orbBottom} />

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.back}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.logoRow}>
              <Ionicons name="paw" size={14} color={Colors.accentLight} />

              <Text style={styles.logo}>CLYVO VET</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim,
                },
              ],
            }}
          >
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />

                <Text style={styles.badgeText}>ENTRAR</Text>
              </View>
            </View>

            <Text style={styles.title}>
              Bem-vindo{"\n"}
              de volta 👋
            </Text>

            <Text style={styles.sub}>
              Acesse sua conta para continuar
              {"\n"}
              cuidando do seu pet
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: cardAnim,
                  },
                ],
              },
            ]}
          >
            <InputField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seu@email.com"
              icon={
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={Colors.textSecondary}
                />
              }
            />

            <View style={styles.dividerField} />

            <InputField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              placeholder="••••••••"
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.textSecondary}
                />
              }
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity
                style={styles.forgotBtn}
                activeOpacity={0.6}
                onPress={handleForgotPassword}
                disabled={resetLoading}
              >
                <Text style={styles.forgotText}>
                  {resetLoading ? "Enviando..." : "Esqueci minha senha"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.btnPrimary,
                loading && {
                  opacity: 0.6,
                },
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <Text style={styles.btnPrimaryText}>Entrando...</Text>
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Entrar na conta</Text>

                  <View style={styles.btnArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color={Colors.accentLight}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />

              <Text style={styles.dividerText}>ou</Text>

              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[
                styles.btnSecondary,
                {
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                },
                googleLoading && {
                  opacity: 0.6,
                },
              ]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || !googleReady}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-google" size={16} color={Colors.white} />

              <Text style={styles.btnSecondaryText}>
                {googleLoading ? "Conectando..." : "Entrar com Google"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Criar nova conta</Text>
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color="rgba(255,255,255,0.3)"
                />

                <Text style={styles.trustText}>Seguro</Text>
              </View>

              <View style={styles.trustItem}>
                <Ionicons
                  name="lock-closed-outline"
                  size={12}
                  color="rgba(255,255,255,0.3)"
                />

                <Text style={styles.trustText}>Criptografado</Text>
              </View>

              <View style={styles.trustItem}>
                <Ionicons
                  name="heart-outline"
                  size={12}
                  color="rgba(255,255,255,0.3)"
                />

                <Text style={styles.trustText}>Privado</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
