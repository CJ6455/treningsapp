import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Clients from "../../app/professional/clients";
import ClientPage from "../../app/professional/modals/clientPage";
import React from "react";
import { ClientPageStackParamList } from "../navigationOptions";
const Stack = createNativeStackNavigator<ClientPageStackParamList>();

const ClientPageStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Clients" component={Clients} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="ClientPage" component={ClientPage} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default ClientPageStackNavigator;
