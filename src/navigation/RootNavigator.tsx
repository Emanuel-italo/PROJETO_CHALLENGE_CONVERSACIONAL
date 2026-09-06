import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabs from "./MainTabs";

import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";

import AddPetScreen from "../screens/pet/AddPetScreen";
import PetDetailScreen from "../screens/pet/PetDetailScreen";
import PetChatScreen from "../screens/pet/PetChatScreen";

import HealthCalendarScreen from "../screens/health/HealthCalendarScreen";
import VaccinesScreen from "../screens/health/VaccinesScreen";
import MedicationsScreen from "../screens/health/MedicationsScreen";
import PendingScreen from "../screens/health/PendingScreen";
import AddHealthRecordScreen from "../screens/health/AddHealthRecordScreen";

import { useAuth } from "../hooks/useAuth";
import { Colors } from "../styles/colors";
import { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function VerifyStack() {
  return (
    <Stack.Navigator
      initialRouteName="VerifyEmail"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />
      <Stack.Screen name="PetChat" component={PetChatScreen} />
      <Stack.Screen name="HealthCalendar" component={HealthCalendarScreen} />
      <Stack.Screen name="Vaccines" component={VaccinesScreen} />
      <Stack.Screen name="Medications" component={MedicationsScreen} />
      <Stack.Screen name="Pending" component={PendingScreen} />
      <Stack.Screen name="AddHealthRecord" component={AddHealthRecordScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.primary,
        }}
      >
        <ActivityIndicator size="large" color={Colors.accentLight} />
      </View>
    );
  }

  if (!user) return <AuthStack />;

  if (!user.emailVerified) return <VerifyStack />;

  return <AppStack />;
}
