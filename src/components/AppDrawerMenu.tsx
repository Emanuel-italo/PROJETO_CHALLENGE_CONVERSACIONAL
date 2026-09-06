import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../styles/colors";
import { MainTabParamList } from "../types";

import { styles } from "../styles/MainTabsStyles";

type MenuItem = {
  rota: keyof MainTabParamList;
  label: string;
  icone: keyof typeof Ionicons.glyphMap;
};

const MENU_ITEMS: MenuItem[] = [
  { rota: "Dashboard", label: "Início", icone: "home-outline" },
  { rota: "Pets", label: "Pets", icone: "paw-outline" },
  { rota: "Health", label: "Saúde", icone: "heart-outline" },
  { rota: "Calendar", label: "Calendário", icone: "calendar-outline" },
  { rota: "Profile", label: "Perfil", icone: "person-outline" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AppDrawerMenu({ visible, onClose }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const handleNavigate = (rota: keyof MainTabParamList) => {
    onClose();
    navigation.navigate(rota);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.rota}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.rota)}
            >
              <Ionicons name={item.icone} size={20} color={Colors.white} />

              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
