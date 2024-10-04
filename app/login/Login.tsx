import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  AppState,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import { Button } from "../../components/button"; // Assume you have a custom Button component
import { supabase } from "../../supabase";
import ThemedStyle from "../../styleSheet";
import { useAuth } from "../../services/AuthContext";
import { AuthStackParamList } from "../../navigation/navigationOptions";
const Login = () => {
  const style = ThemedStyle();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  // Handle normal login
  async function signInWithEmail() {
    const { error } = await signIn(email, password);

    if (error) Alert.alert(error.message);
  }
  // Handle Face ID login
  const faceIDLoginHandler = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const faceIdUsersJson = await SecureStore.getItemAsync("faceIdUsers");
      let faceIdUsers = faceIdUsersJson ? JSON.parse(faceIdUsersJson) : [];

      if (faceIdUsers.length === 0) {
        alert("Face ID not activated");
        return;
      }

      // Perform biometric authentication
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate with Face ID",
        fallbackLabel: "Use Passcode",
      });

      if (biometricAuth.success) {
        let selectedUser;
        if (faceIdUsers.length === 1) {
          selectedUser = faceIdUsers[0];
        } else {
          // Prompt user to select an account
          selectedUser = await promptUserSelection(faceIdUsers);
        }

        if (!selectedUser) {
          alert("No user selected");
          return;
        }

        const savedEmail = await SecureStore.getItemAsync(
          `userEmail_${selectedUser.userId}`
        );
        const savedPassword = await SecureStore.getItemAsync(
          `userPassword_${selectedUser.userId}`
        );

        if (!savedEmail || !savedPassword) {
          throw new Error("Could not retrieve stored credentials");
        }

        const { error } = await signIn(savedEmail, savedPassword);

        if (error) Alert.alert(error.message);
      } else {
        alert("Face ID authentication failed");
      }
    } else {
      alert("Face ID is not available on this device");
    }
  };
  interface FaceIdUser {
    userId: string;
    email: string;
  }
  // Function to prompt the user to select an account
  const promptUserSelection = (users: FaceIdUser[]) => {
    return new Promise((resolve) => {
      Alert.alert(
        "Select Account",
        "Please select an account to log in with Face ID:",
        users.map((user) => ({
          text: user.email,
          onPress: () => resolve(user),
        })),
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  };

  const signUpHandler = () => {
    nav.navigate("Register");
  };

  return (
    <SafeAreaView style={[style.main, style.form, { marginTop: 35 }]}>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          width: "100%",
        }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={[style.header, { fontSize: 35, marginBottom: 20 }]}>
            Helsekompaniet
          </Text>
          <Text style={[style.text, { marginBottom: 60 }]}>
            God helse - helt enkelt
          </Text>
          <Text style={style.header}>Login</Text>
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
          <Button label="Log in" onPress={signInWithEmail} />
          <Button label="Log in with Face ID" onPress={faceIDLoginHandler} />
          <Pressable onPress={signUpHandler}>
            <Text style={style.text}>Don't have an account? Sign up here</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
