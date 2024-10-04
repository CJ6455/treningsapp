import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppointmentsStackParamList } from "../navigationOptions";
import Appointments from "../../app/client/Appointments";
import CreateAppointment from "../../app/client/modals/createAppointment";
import React from "react";
const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

const MessagesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Appointments" component={Appointments} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="CreateAppointment" component={CreateAppointment} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default MessagesStackNavigator;
