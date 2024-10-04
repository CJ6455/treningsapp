// navigation/ProTabNav.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ProHome from "../app/professional/proHome";
import Clients from "../app/professional/clients";
import MessagesStackNavigator from "./commonStacks/MessagesStackNavigator"; // Reuse existing navigators if applicable
import ProAppointments from "../app/professional/proAppointments";
import SettingsStackNavigator from "./commonStacks/SettingsStackNavigator";
import { ProfessionalTabParamList } from "./navigationOptions";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import ClientPageStackNavigator from "./professionalStacks/clientPageNavigator";

const Tab = createBottomTabNavigator<ProfessionalTabParamList>();

const ProTabNav: React.FC = () => {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#17C3B2",
        tabBarInactiveTintColor: colorScheme === "dark" ? "#F5F5F5" : "#121212",
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#121212" : "#F5F5F5",
          borderTopColor:
            colorScheme === "dark"
              ? "rgba(239, 255, 250,0.3)"
              : "rgba(37, 41, 46,0.3)",
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          borderRightColor:
            colorScheme === "dark"
              ? "rgba(239, 255, 250,0.3)"
              : "rgba(37, 41, 46,0.3)",
          borderRightWidth: 1,
          marginTop: 5,
        },
      }}
    >
      <Tab.Screen
        name="Hjem"
        component={ProHome}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Klienter"
        component={ClientPageStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Meldinger"
        component={MessagesStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-square" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Avtaler"
        component={ProAppointments}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Instillinger"
        component={SettingsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" color={color} size={size} />
          ),
          tabBarItemStyle: {
            borderRightWidth: 0,
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default ProTabNav;
