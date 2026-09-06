import React from "react";
import { LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";

import { AuthProvider } from "./src/contexts/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Necessário para o fluxo de login com Google (expo-auth-session) fechar
// corretamente a aba/janela de autenticação ao redirecionar de volta ao app.
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  LogBox.ignoreAllLogs();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
