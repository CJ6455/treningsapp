import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MessagesStackParamList } from "../navigationOptions";
import Messages from "../../app/common/Messages";
import Chat from "../../app/common/modals/chat";
import React from "react";
const Stack = createNativeStackNavigator<MessagesStackParamList>();

const MessagesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Messages" component={Messages} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Chat" component={Chat} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default MessagesStackNavigator;
