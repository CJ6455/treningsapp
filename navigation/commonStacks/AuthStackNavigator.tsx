import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigationOptions";
import Login from "../../app/login/Login";
import Register from "../../app/login/Register";
import React from "react";
const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
};

export default AuthStackNavigator;
