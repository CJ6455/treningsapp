import { StyleSheet } from "react-native";

import AppNavigator from "./navigation/AppNavigator";

import { AuthProvider } from "./services/AuthContext";

import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
