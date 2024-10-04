import { View, Text, Platform, Image } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ThemedStyle } from "../../styleSheet";

import { Button } from "../../components/button";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { IconButton } from "../../components/iconButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../supabase";
import { Session } from "@supabase/supabase-js";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import downloadImage from "../../api/imageStorage";
import { useAuth } from "../../services/AuthContext";
import { SettingsStackParamList } from "../../navigation/navigationOptions";

export interface User {
  id: string;
  username: string;
  avatar_url: string;
  full_name: string;
  created_at: string;
}
const Settings = () => {
  const style = ThemedStyle();
  const [faceId, setFaceId] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { session } = useAuth();
  const nav =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { signOut } = useAuth();
  useEffect(() => {
    const fetchFaceIdStatus = async () => {
      if (!session || !session.user || !session.user.id) return;
      const faceIdEnabled = await SecureStore.getItemAsync(
        `faceIdEnabled_${session.user.id}`
      );
      setFaceId(faceIdEnabled === "true");
    };

    if (Platform.OS !== "web") fetchFaceIdStatus();
  }, []);

  useEffect(() => {
    if (session) fetchUser();
  }, [session]);

  const fetchUser = async () => {
    try {
      if (!session?.user) throw new Error("No user on the session!");
      const { data, error } = await supabase
        .from("profiles")
        .select()
        .eq("id", session.user.id)
        .single();
      if (error) throw error;

      data.avatar_url = await downloadImage("avatars", data.avatar_url);

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleFaceID = async () => {
    if (!session || !session.user) {
      alert("User not logged in");
      return;
    }
    if (faceId) {
      // If Face ID is enabled, disable it and remove credentials
      await SecureStore.deleteItemAsync(`userEmail_${session.user.id}`);
      await SecureStore.deleteItemAsync(`userPassword_${session.user.id}`);
      await SecureStore.deleteItemAsync(`faceIdEnabled_${session.user.id}`);
      // Remove user ID from the list of Face ID enabled users
      await removeFaceIdUser(session.user.id);
      setFaceId(false);
      Alert.alert("Face ID disabled");
    } else {
      // If Face ID is disabled, enable it and store credentials
      promptForCredentials();
    }
  };

  const promptForCredentials = () => {
    Alert.prompt(
      "Enter Credentials",
      "Please enter your password",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async (password) => {
            try {
              if (!session || !session.user || !session.user.email) {
                alert("User not logged in");
                return;
              }
              if (!password) {
                alert("Password required");
                return;
              }

              // Verify the credentials

              const { error } = await supabase.auth.signInWithPassword({
                email: session.user.email,
                password: password,
              });
              if (error) {
                alert("Invalid credentials");

                return;
              }

              // Store the credentials under user-specific keys
              await SecureStore.setItemAsync(
                `userEmail_${session.user.id}`,
                session.user.email
              );

              await SecureStore.setItemAsync(
                `userPassword_${session.user.id}`,
                password
              );
              await SecureStore.setItemAsync(
                `faceIdEnabled_${session.user.id}`,
                "true"
              );
              // Add user ID to the list of Face ID enabled users
              await addFaceIdUser(session.user.id, session.user.email);
              setFaceId(true);
              Alert.alert("Face ID enabled");
            } catch (error) {
              console.log(error);
            }
          },
        },
      ],
      "secure-text"
    );
  };

  // Helper functions to manage the list of Face ID enabled users
  const addFaceIdUser = async (userId: string, email: string) => {
    const faceIdUsersJson = await SecureStore.getItemAsync("faceIdUsers");
    let faceIdUsers = faceIdUsersJson ? JSON.parse(faceIdUsersJson) : [];
    // Check if user is already in the list
    if (
      !faceIdUsers.some(
        (user: { userId: String; email: string }) => user.userId === userId
      )
    ) {
      faceIdUsers.push({ userId, email });
      await SecureStore.setItemAsync(
        "faceIdUsers",
        JSON.stringify(faceIdUsers)
      );
    }
  };

  const removeFaceIdUser = async (userId: string) => {
    const faceIdUsersJson = await SecureStore.getItemAsync("faceIdUsers");
    let faceIdUsers = faceIdUsersJson ? JSON.parse(faceIdUsersJson) : [];
    faceIdUsers = faceIdUsers.filter(
      (user: { userId: String; email: string }) => user.userId !== userId
    );
    await SecureStore.setItemAsync("faceIdUsers", JSON.stringify(faceIdUsers));
  };

  const updateProfile = async (payload: any) => {
    if (payload.new) {
      if (payload.new.avatar_url) {
        payload.new.avatar_url = await downloadImage(
          "avatars",
          payload.new.avatar_url
        );
      }

      const updatedUser: User = {
        id: payload.new.id,
        username: payload.new.username,
        avatar_url: payload.new.avatar_url,
        full_name: payload.new.full_name,
        created_at: payload.new.created_at,
      };
      setUser(updatedUser);
    }
  };

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`profiles:id=eq.${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.user.id}`,
        },
        updateProfile
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [session]);
  return (
    <SafeAreaView style={style.main}>
      <View style={style.topSection}>
        <Text style={[style.header, style.secondaryColor]}>Innstillinger</Text>
      </View>
      <Text style={style.text}>Logged in as:</Text>
      <Text style={[style.text, { margin: 10 }]}>{user?.full_name}</Text>
      <Image
        source={{ uri: user?.avatar_url }}
        style={{
          width: 40,

          aspectRatio: 1,
          borderRadius: 20,
          marginBottom: 20,
        }}
      />
      <Text style={style.text}>Endre brukeren:</Text>
      <IconButton
        name="user"
        size={24}
        onPress={() => nav.navigate("EditAccount")}
      />
      <Button
        label="Log out"
        onPress={() => {
          signOut();
        }}
      />
      {Platform.OS === "web" ? (
        <></>
      ) : (
        <>
          <Text style={style.text}>
            Face ID is {faceId ? "enabled" : "disabled"}
          </Text>
          <Button
            label={faceId ? "Turn off face Id" : "Turn on face Id"}
            onPress={toggleFaceID}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default Settings;
