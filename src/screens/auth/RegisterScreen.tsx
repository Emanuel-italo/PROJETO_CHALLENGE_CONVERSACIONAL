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

import {
  validarFormularioUsuario,
  validarCampoObrigatorio,
  validarEmail,
  validarTelefone,
} from "../../utils/validators";

import InputField from "../../components/InputField";

import { styles } from "../../styles/RegisterScreen.styles";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

const STEPS = [
  {
    key: "personal",
    label: "Seus dados",
    icon: "person-outline" as const,
  },

  {
    key: "security",
    label: "Segurança",
    icon: "lock-closed-outline" as const,
  },
];

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const {
    promptGoogleSignIn,
    isReady: googleReady,
    loading: googleLoading,
  } = useGoogleAuth();

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(30)).current;

  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateStep = () => {
    stepAnim.setValue(20);

    Animated.timing(stepAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (!validarCampoObrigatorio(form.name)) {
      newErrors.name = "Nome obrigatório";
    }

    if (!validarCampoObrigatorio(form.email)) {
      newErrors.email = "E-mail obrigatório";
    } else if (!validarEmail(form.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!validarCampoObrigatorio(form.phone)) {
      newErrors.phone = "Telefone obrigatório";
    } else if (!validarTelefone(form.phone)) {
      newErrors.phone = "Telefone inválido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    animateStep();

    setStep(1);
  };

  const handleRegister = async () => {
    const validationErrors = validarFormularioUsuario(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      return;
    }

    setLoading(true);

    try {
      await register(form.name, form.email, form.password);
    } catch (error: any) {
      showAlert("Erro", mapFirebaseAuthError(error?.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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
        style={styles.flex}
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
              style={styles.back}
              activeOpacity={0.7}
              onPress={() => {
                if (step === 1) {
                  animateStep();

                  setStep(0);
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={Colors.accentLight}
              />
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

                <Text style={styles.badgeText}>CADASTRO</Text>
              </View>
            </View>

            <Text style={styles.title}>
              Crie sua{"\n"}
              conta 🐾
            </Text>

            <Text style={styles.sub}>
              Comece a cuidar do seu pet{"\n"}
              com inteligência hoje
            </Text>
          </Animated.View>

          <View style={styles.stepIndicator}>
            {STEPS.map((item, index) => (
              <View key={item.key} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,

                    index <= step && styles.stepDotActive,

                    index < step && styles.stepDotDone,
                  ]}
                >
                  {index < step ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={Colors.primary}
                    />
                  ) : (
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={
                        item.key === "security"
                          ? Colors.black
                          : index <= step
                            ? Colors.primary
                            : "rgba(255,255,255,0.35)"
                      }
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.stepLabel,

                    index <= step && styles.stepLabelActive,
                  ]}
                >
                  {item.label}
                </Text>

                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,

                      index < step && styles.stepLineDone,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,

                transform: [
                  {
                    translateY: stepAnim,
                  },
                ],
              },
            ]}
          >
            {step === 0 ? (
              <>
                <Text style={styles.sectionTitle}>Informações pessoais</Text>

                <InputField
                  label="Nome completo"
                  value={form.name}
                  onChangeText={(v) => handleChange("name", v)}
                  error={errors.name}
                  placeholder="Maria Silva"
                  icon={
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  }
                />

                <View style={styles.dividerField} />

                <InputField
                  label="E-mail"
                  value={form.email}
                  onChangeText={(v) => handleChange("email", v)}
                  error={errors.email}
                  placeholder="maria@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  label="Telefone / WhatsApp"
                  value={form.phone}
                  onChangeText={(v) => handleChange("phone", v)}
                  error={errors.phone}
                  placeholder="(11) 99999-0000"
                  keyboardType="phone-pad"
                  icon={
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  }
                />

                <View style={styles.dividerField} />

                <InputField
                  label="Endereço"
                  value={form.address}
                  onChangeText={(v) => handleChange("address", v)}
                  error={errors.address}
                  placeholder="Rua das Flores, 123 — SP"
                  icon={
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  }
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Crie sua senha</Text>

                <InputField
                  label="Senha"
                  value={form.password}
                  onChangeText={(v) => handleChange("password", v)}
                  error={errors.password}
                  placeholder="••••••••"
                  secureTextEntry
                  icon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  }
                />

                <View style={styles.dividerField} />

                <InputField
                  label="Confirmar senha"
                  value={form.confirmPassword}
                  onChangeText={(v) => handleChange("confirmPassword", v)}
                  error={errors.confirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  icon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  }
                />

                <View style={styles.passwordHint}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color="rgba(255,255,255,0.35)"
                  />

                  <Text style={styles.passwordHintText}>
                    Use pelo menos 6 caracteres com letras e números
                  </Text>
                </View>
              </>
            )}
          </Animated.View>

          <View style={styles.actions}>
            {step === 0 ? (
              <TouchableOpacity
                style={styles.btnPrimary}
                activeOpacity={0.85}
                onPress={handleNext}
              >
                <Text style={styles.btnPrimaryText}>Continuar</Text>

                <View style={styles.btnArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={Colors.accentLight}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.btnPrimary,

                  loading && {
                    opacity: 0.6,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.btnPrimaryText}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Text>

                {!loading && (
                  <View style={styles.btnArrow}>
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={Colors.accentLight}
                    />
                  </View>
                )}
              </TouchableOpacity>
            )}

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
              activeOpacity={0.7}
              onPress={handleGoogleRegister}
              disabled={googleLoading || !googleReady}
            >
              <Ionicons name="logo-google" size={16} color={Colors.white} />

              <Text style={styles.btnSecondaryText}>
                {googleLoading ? "Conectando..." : "Cadastrar com Google"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSecondary, { marginTop: 14 }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.btnSecondaryText}>
                Já tenho conta — Entrar
              </Text>
            </TouchableOpacity>

            <View style={styles.legalRow}>
              <Ionicons
                name="shield-outline"
                size={11}
                color="rgba(255,255,255,0.25)"
              />

              <Text style={styles.legalText}>
                Ao criar conta, você aceita os Termos de Uso
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
