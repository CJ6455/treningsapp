import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  useColorScheme,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemedStyle from "../../styleSheet";
import { IconButton } from "../../components/iconButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";

import Icons from "@expo/vector-icons/MaterialCommunityIcons";

import { supabase } from "../../supabase";

import { useAuth } from "../../services/AuthContext";
import { ProgramsStackParamList } from "../../navigation/navigationOptions";
import fetchWorkoutPlans from "../../api/getWorkoutPlans";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { set } from "date-fns";

export interface WorkoutPlanInfo {
  id: string;
  title: string;
  description: string;
  created_at: Date;
  created_by: string;
}

export interface WorkoutPlan {
  id: string;
  client_id: string;
  price: number;
  assigned_at: Date;
  assigned_by: string;
  status: string;
  start_date: Date;
  workout_plan: WorkoutPlanInfo;
}
const Programs = () => {
  const styles = ThemedStyle();
  const theme = useColorScheme();
  const nav =
    useNavigation<NativeStackNavigationProp<ProgramsStackParamList>>();
  const { session } = useAuth();
  const [programs, setPrograms] = useState<WorkoutPlan[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  useEffect(() => {
    if (!session) return;
    const getClientId = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", session.user.id);
      if (error) {
        console.error("Error fetching client ID:", error);
        return;
      }
      setClientId(data[0].id);
    };

    getClientId();
  }, [session]);

  useEffect(() => {
    if (!clientId) return;
    const getWorkoutPlans = async () => {
      const workoutPlans = await fetchWorkoutPlans(clientId);
      if (workoutPlans) {
        setPrograms(workoutPlans);
      }
    };
    getWorkoutPlans();
  }, [clientId]);

  const renderItem: ListRenderItem<WorkoutPlan> = ({ item }) => {
    return (
      <Pressable
        style={[styles.container]}
        onPress={() => nav.navigate("WorkoutPlan", { program: item })}
      >
        <View
          style={[
            styles.cardColumn,
            item.status === "completed" && styles.completedCard,
          ]}
        >
          {item.status === "completed" && (
            <View style={styles.completedOverlay} />
          )}
          <Text style={styles.title}>{item.workout_plan.title}</Text>
          <Text style={styles.description}>
            {item.workout_plan.description}
          </Text>
          {}
          <Text
            style={[
              styles.statusText,
              item.status === "pending" && styles.pendingStatus,
              item.status === "completed" && [
                styles.completedStatus,
                { alignSelf: "flex-start" },
              ],
            ]}
          >
            {item.status === "pending"
              ? "Avventer"
              : item.status === "completed"
              ? "Fullført"
              : "Aktiv"}
          </Text>
          {item.status === "completed" && (
            <Icons name="check-circle" size={24} style={styles.completedIcon} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.main}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Icons
          name="format-list-bulleted"
          size={24}
          color="black"
          style={{
            color:
              theme === "dark" ? "rgba(239, 255, 250,1)" : "rgba(37, 41, 46,1)",
          }}
        />
        <Text style={[styles.text, { marginLeft: 10 }]}>
          Oversikt over treningspogrammer og matplaner
        </Text>
      </View>
      <FlatList
        style={{ width: "80%" }}
        data={programs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

export default Programs;
