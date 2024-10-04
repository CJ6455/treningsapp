// navigation/AppNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClientTabNavigator from "./ClientTabNavigator";

import AuthStackNavigator from "./commonStacks/AuthStackNavigator";
import { RootStackParamList } from "./navigationOptions";
import { useAuth } from "../services/AuthContext";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";
import ProfessionalTabNavigator from "./ProfessionalTabNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { session, role, loading } = useAuth();
  const colorScheme = useColorScheme();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17C3B2" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          role === "professional" ? (
            <Stack.Screen name="ProTab" component={ProfessionalTabNavigator} />
          ) : (
            <Stack.Screen name="CliTab" component={ClientTabNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
