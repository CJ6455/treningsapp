import { useNavigation } from "@react-navigation/native";

import { useState } from "react";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import ThemedStyle from "../../styleSheet";
import { Button } from "../../components/button";
import { useAuth } from "../../services/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../supabase";
import { AuthStackParamList } from "../../navigation/navigationOptions";
//Todo => give feedback based on registration validation

const Register = () => {
  const style = ThemedStyle();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  async function signUpWithEmail() {
    const { error } = await signUp(email, password);
    if (error) {
      Alert.alert(error.message);
    }
  }

  const loginHandler = () => {
    nav.navigate("Login");
  };

  return (
    <SafeAreaView style={[style.main]}>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          width: "100%",
        }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={style.header}>Register</Text>

          <TextInput
            style={style.input}
            placeholder="Email"
            value={email}
            keyboardType="email-address"
            onChangeText={setEmail}
          />
          <TextInput
            style={style.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button label="Register" onPress={signUpWithEmail} />
          <Pressable onPress={loginHandler}>
            <Text style={style.text}>Already have an account? Login here</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default Register;
