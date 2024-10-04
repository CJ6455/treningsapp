import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsStackParamList } from "../navigationOptions";
import Settings from "../../app/common/Settings";
import Account from "../../app/common/modals/account";
import React from "react";
const Stack = createNativeStackNavigator<SettingsStackParamList>();

const MessagesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="EditAccount" component={Account} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default MessagesStackNavigator;
