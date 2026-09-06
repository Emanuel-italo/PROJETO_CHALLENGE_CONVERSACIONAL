import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../styles/colors";
import { useAuth } from "../hooks/useAuth";
import { MainTabParamList } from "../types";

import AppDrawerMenu from "./AppDrawerMenu";

import { styles } from "../styles/MainTabsStyles";

const TAB_TITLES: Record<keyof MainTabParamList, string> = {
  Dashboard: "Início",
  Pets: "Pets",
  Health: "Saúde",
  Calendar: "Calendário",
  Profile: "Perfil",
};

type Props = {
  route: RouteProp<MainTabParamList, keyof MainTabParamList>;
};

export default function MainHeader({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);

  const firstName = (user?.displayName || "Usuário").split(" ")[0];

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const isDashboard = route.name === "Dashboard";

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu" size={28} color={Colors.white} />
        </TouchableOpacity>

        {isDashboard ? (
          <View style={styles.centerArea}>
            <View style={styles.logoRow}>
              <Ionicons name="paw" size={18} color={Colors.accentLight} />

              <Text style={styles.logo}>CLYVO</Text>
            </View>

            <Text style={styles.greeting}>Olá, {firstName} 👋</Text>

            <Text style={styles.date}>{currentDate}</Text>
          </View>
        ) : (
          <Text style={styles.screenTitle}>{TAB_TITLES[route.name]}</Text>
        )}

        <View style={styles.rightSpacer} />
      </View>

      <AppDrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
}
