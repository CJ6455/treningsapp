// HomeStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../../app/client/Index";

import LikedBy from "../../app/client/modals/likedBy";

import {
  getStackScreenOptions,
  HomeStackParamList,
} from "../navigationOptions";
import { useColorScheme } from "react-native";
import { IconButton } from "../../components/iconButton";

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => {
  const colorScheme = useColorScheme();

  return (
    <Stack.Navigator screenOptions={getStackScreenOptions(colorScheme)}>
      <Stack.Screen
        name="Home"
        component={Home}
        options={({ navigation }) => ({
          headerRight: () => (
            <IconButton
              name="plus-square"
              size={24}
              onPress={() => navigation.navigate("CreateBlogPost")}
            />
          ),
        })}
      />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="LikedBy" component={LikedBy} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
