import React, { useEffect, useRef } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../../types";

import { Colors } from "../../styles/colors";

import { styles } from "../../styles/WelcomeScreen.styles";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Welcome">;
};

export default function WelcomeScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(40)).current;

  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(actionsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.container}>
        <View style={styles.orb1} />

        <View style={styles.orb2} />

        <View style={styles.orb3} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,

              transform: [
                {
                  scale: scaleAnim,
                },
              ],
            },
          ]}
        >
          <View style={styles.logoWrap}>
            <View style={styles.logoRing}>
              <View style={styles.logoBox}>
                <Ionicons name="paw" size={32} color={Colors.primary} />
              </View>
            </View>
          </View>

          <Animated.View
            style={{
              transform: [
                {
                  translateY: slideAnim,
                },
              ],

              opacity: fadeAnim,
            }}
          >
            <Text style={styles.brand}>
              CLYVO
              <Text style={styles.brandAccent}> VET</Text>
            </Text>

            <Text style={styles.tagline}>
              O sistema operacional{"\n"}
              do <Text style={styles.taglineHL}>cuidado contínuo</Text>
              {"\n"}
              do seu pet
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.pillsRow,
              {
                opacity: actionsAnim,
              },
            ]}
          >
            {["Preventivo", "Terapêutico", "Chat Personalizado"].map((p) => (
              <View key={p} style={styles.pill}>
                <Text style={styles.pillText}>{p}</Text>
              </View>
            ))}
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.actions,
            {
              opacity: actionsAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.btnPrimaryText}>Criar conta gratuita</Text>

            <View style={styles.btnArrow}>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={Colors.accentLight}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.btnSecondaryText}>Já tenho conta — Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            Ao continuar, você aceita os Termos de Uso
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
