// Account.tsx
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Button, Input } from "@rneui/themed";
import { supabase } from "../../../supabase";
import { Session } from "@supabase/supabase-js";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Avatar from "../../../components/avatar";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { set } from "date-fns";
import { useAuth } from "../../../services/AuthContext";
import { SettingsStackParamList } from "../../../navigation/navigationOptions";
import ThemedStyle from "../../../styleSheet";
// Define TypeScript interfaces for better type safety
interface Specialist {
  id: string;
  user_id: string;
  bio: string;
}

interface SpecialistType {
  id: string;
  name: string;
}

interface SelectedType {
  type_id: string;
}

interface Profile {
  username: string;
  full_name: string;
  avatar_url: string | null;
}

const Account: React.FC = () => {
  // State Definitions with TypeScript Types
  const [loading, setLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [specialistTypes, setSpecialistTypes] = useState<SpecialistType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const [bio, setBio] = useState<string>("");
  // Fetch User Session on Component Mount
  const { session, role } = useAuth();
  const colorStyle = ThemedStyle();
  // Fetch User Profile when Session is Available
  useEffect(() => {
    if (session) {
      getProfile();
    }
  }, [session]);

  // Fetch Specialist Types and Selected Types when Specialist Data is Available
  useEffect(() => {
    if (!specialist) return;

    const getSpecialistTypes = async () => {
      try {
        setLoading(true);

        // Fetch all specialist types
        const { data: typesData, error: typesError } = await supabase
          .from("specialist_types")
          .select("*");

        if (typesError) throw typesError;
        setSpecialistTypes(typesData as SpecialistType[]);

        // Fetch selected types for the specialist
        const { data: selectedData, error: selectedTypeError } = await supabase
          .from("specialist_specialistType")
          .select("type_id")
          .eq("specialist_id", specialist.id);

        if (selectedTypeError) throw selectedTypeError;

        const selectedIds = selectedData.map(
          (type: SelectedType) => type.type_id
        );
        setSelectedTypes(selectedIds);
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert("Error", error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    getSpecialistTypes();
  }, [specialist]);

  // Function to Fetch User Profile
  const getProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user session found.");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, full_name, avatar_url`)
        .eq("id", session.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setFullName(data.full_name);
        setAvatarUrl(data.avatar_url);

        // Fetch specialist data associated with the user
        if (role === "professional") {
          const { data: specialistData, error: specialistError } =
            await supabase
              .from("specialists")
              .select("*")
              .eq("user_id", session.user.id)
              .single();

          if (specialistError && specialistError.code !== "PGRST116") {
            // PGRST116: Row not found (user might not have a specialist profile)
            throw specialistError;
          }

          if (specialistData) {
            setSpecialist(specialistData);
            setBio(specialistData.bio);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to Update User Profile
  const updateProfile = async ({
    username,
    full_name,
    avatar_url,
  }: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  }) => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user session found.");

      const updates: Partial<Profile> & { id: string; updated_at: string } = {
        id: session.user.id,
        username,
        full_name,
        updated_at: new Date().toISOString(),
      };

      if (avatar_url !== null) {
        updates.avatar_url = avatar_url;
      }

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }

      Alert.alert("Success", "Profile updated successfully!");
      navigation.navigate("Settings");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler to Toggle Specialist Type Selection
  const toggleSpecialistType = (typeId: string) => {
    setSelectedTypes((prevSelected) => {
      if (prevSelected.includes(typeId)) {
        // Remove the typeId
        return prevSelected.filter((id) => id !== typeId);
      } else {
        // Add the typeId
        return [...prevSelected, typeId];
      }
    });
  };
  const updateSpecialist = async () => {
    try {
      setLoading(true);
      if (!specialist) throw new Error("No specialist data found.");

      const { data, error } = await supabase.from("specialists").upsert([
        {
          id: specialist.id,
          user_id: specialist.user_id,
          bio: bio,
        },
      ]);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  // Handler to Save Specialist Types Selection
  const saveSpecialistTypes = async () => {
    if (!specialist) return;

    try {
      setLoading(true);

      // First, delete existing associations
      const { error: deleteError } = await supabase
        .from("specialist_specialistType")
        .delete()
        .eq("specialist_id", specialist.id);

      if (deleteError) throw deleteError;

      // Insert new associations
      const insertData = selectedTypes.map((typeId) => ({
        specialist_id: specialist.id,
        type_id: typeId,
      }));

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from("specialist_specialistType")
          .insert(insertData);

        if (insertError) throw insertError;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Display Loading Indicator While Fetching Data
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Render Function for Specialist Types
  const renderType = (type: SpecialistType) => {
    const isSelected = selectedTypes.includes(type.id);
    return (
      <TouchableOpacity
        key={type.id}
        onPress={() => toggleSpecialistType(type.id)}
        style={styles.typeContainer}
        accessibilityLabel={`Select ${type.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.typeText}>{type.name}</Text>
        {isSelected && (
          <MaterialCommunityIcons name="check" size={24} color="blue" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={colorStyle.main}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView>
          {/* Avatar Component */}
          <Avatar
            size={200}
            url={avatarUrl}
            onUpload={(path: string) => {
              setAvatarUrl(path);
            }}
          />

          {/* Specialist Section */}
          {role === "professional" && (
            <>
              <Input label="Bio" value={bio} onChangeText={setBio} multiline />

              {/* Specialist Types Selection */}
              <Text style={[styles.sectionTitle, colorStyle.text]}>
                Specialist Types
              </Text>
              {specialistTypes.length > 0 ? (
                specialistTypes.map((type) => renderType(type))
              ) : (
                <Text style={[styles.noTypesText, colorStyle.text]}>
                  No specialist types available.
                </Text>
              )}
            </>
          )}

          {/* User Information Inputs */}
          <View style={styles.inputGroup}>
            <Input
              label="Email"
              style={colorStyle.text}
              value={session?.user?.email || ""}
              disabled
              leftIcon={{ type: "material", name: "email" }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Input
              label="Username"
              style={colorStyle.text}
              value={username}
              onChangeText={(text) => setUsername(text)}
              leftIcon={{ type: "material", name: "person" }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Input
              label="Full Name"
              style={colorStyle.text}
              value={fullName}
              onChangeText={(text) => setFullName(text)}
              leftIcon={{
                type: "material",
                name: "badge",
              }}
            />
          </View>

          {/* Update Profile Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? "Updating..." : "Update Profile"}
              onPress={() => {
                updateProfile({
                  username,
                  full_name: fullName,
                  avatar_url: avatarUrl,
                });
                if (role === "professional") {
                  updateSpecialist();
                  saveSpecialistTypes();
                }
              }}
              disabled={loading}
              buttonStyle={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Stylesheet with Enhanced Styles
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures SafeAreaView takes up full screen
    padding: 20,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1, // Ensures KeyboardAvoidingView takes up full space
  },
  inputGroup: {
    marginVertical: 10,
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  button: {
    width: 200,
    backgroundColor: "#1EB1FC",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  typeContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  typeText: {
    fontSize: 16,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
    alignSelf: "center",
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  saveButtonContainer: {
    marginTop: 10,
    alignSelf: "center",
    width: 200,
  },
  noTypesText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 10,
  },
});

export default Account;
