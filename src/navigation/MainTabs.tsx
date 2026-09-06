import React from "react";
import { View } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/dashboard/DashboardScreen";
import PetsScreen from "../screens/pet/PetsScreen";
import HealthTabScreen from "../screens/health/HealthTabScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import CalendarScreen from "../screens/health/HealthCalendarScreen";

import MainHeader from "../components/MainHeader";

import { Colors } from "../styles/colors";
import { MainTabParamList } from "../types";

import { styles } from "../styles/MainTabsStyles";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<
  keyof MainTabParamList,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  Dashboard: { active: "home", inactive: "home-outline" },
  Pets: { active: "paw", inactive: "paw-outline" },
  Health: { active: "heart", inactive: "heart-outline" },
  Calendar: { active: "calendar", inactive: "calendar-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <MainHeader route={route} />,

        tabBarHideOnKeyboard: true,

        sceneContainerStyle: {
          backgroundColor: Colors.primary,
        },

        tabBarStyle: styles.tabBarStyle,

        tabBarActiveTintColor: Colors.white,

        tabBarInactiveTintColor: "rgba(255,255,255,0.65)",

        tabBarLabelStyle: styles.tabBarLabelStyle,

        tabBarIcon: ({ focused }) => {
          const icon = TAB_ICONS[route.name];

          return (
            <View style={[styles.tabIcon, focused && styles.activeTabIcon]}>
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={24}
                color={Colors.white}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Início" }}
      />

      <Tab.Screen
        name="Pets"
        component={PetsScreen}
        options={{ title: "Pets" }}
      />

      <Tab.Screen
        name="Health"
        component={HealthTabScreen}
        options={{ title: "Saúde" }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: "Calendário" }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}
