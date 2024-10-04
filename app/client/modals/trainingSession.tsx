import {
  View,
  Text,
  KeyboardAvoidingView,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  Platform,
  ListRenderItem,
} from "react-native";
import { supabase } from "../../../supabase";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ThemedStyle from "../../../styleSheet";
import downloadImage from "../../../api/imageStorage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Button } from "../../../components/button";
import { RadioButton } from "react-native-paper";
import { useAuth } from "../../../services/AuthContext";
import { ProgramsStackParamList } from "../../../navigation/navigationOptions";
import { trainingSession } from "./workoutPlan";
import Programs from "../Programs";
export interface ExerciseInfo {
  id: string;
  title: string;
  image_url: string;
  description: string;
  video_url: string;
  status: string;
  created_at: Date;
  created_by: string;
  type: string;
}
export interface Exercise {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_info: ExerciseInfo;

  status: "notCompleted" | "Completed" | "Skipped" | "Partial";
  comment: string;
}
const TrainingSession = () => {
  const route = useRoute();
  const { training_session } = route.params as {
    training_session: trainingSession;
  };
  const { session } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  type ProgramsNavigationProp =
    NativeStackNavigationProp<ProgramsStackParamList>;
  const nav = useNavigation<ProgramsNavigationProp>();
  const styles = ThemedStyle();
  const [publishSession, setPublishSession] = useState(false);

  useEffect(() => {
    if (!session) return;

    const fetchexercises = async () => {
      const { data, error } = await supabase
        .from("user_exercises")
        .select(
          `
            *,
            exercise_info:exercises (
              *
            )
          `
        )
        .eq("session_id", training_session.uS_id)
        .order("exercise_order", { ascending: true });

      if (error) {
        console.log(error);
        return;
      }

      if (data) {
        // Use Promise.all with map to handle async image downloads
        const exercisesWithImages = await Promise.all(
          data.map(async (exercise: any) => {
            const imageUrl = await downloadImage(
              "exercises",
              exercise.exercise_info.image_url
            );
            return {
              ...exercise,
              exercise_info: {
                ...exercise.exercise_info,
                image_url: imageUrl,
              },
            };
          })
        );

        setExercises(exercisesWithImages);
      }
    };

    // Call the function
    fetchexercises();
  }, [session, training_session.uS_id]); // Add dependencies as needed

  const updateExercise = (payload: any) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) =>
        exercise.id === payload.new.id
          ? {
              ...exercise,
              ...payload.new,
              exercise_info: {
                ...exercise.exercise_info,
                ...payload.new.exercise_info,
              },
            }
          : exercise
      )
    );
  };
  useEffect(() => {
    if (!training_session.uS_id) return;
    const channel = supabase
      .channel(`user_exercises:session_id=eq.${training_session.uS_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_exercises",
          filter: `session_id=eq.${training_session.uS_id}`,
        },
        updateExercise
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [training_session.uS_id]);

  const saveSession = async () => {
    const allCompleted = exercises.every(
      (exercise) => exercise.status === "Completed"
    );

    const allSkipped = exercises.every(
      (exercise) => exercise.status === "Skipped"
    );
    const allNotCompleted = exercises.every(
      (exercise) => exercise.status === "notCompleted"
    );

    if (allCompleted || allSkipped) {
      // Set session status based on whether all exercises are skipped
      const sessionStatus = allSkipped ? "Skipped" : "Completed";

      const { error } = await supabase
        .from("user_sessions")
        .update({ status: sessionStatus })
        .eq("id", training_session.uS_id);

      if (error) {
        console.error("Error saving session:", error);
        alert("Failed to save session.");
        return;
      }

      if (publishSession) {
        nav.navigate("PublishSession", { session: training_session });
      } else {
        nav.goBack();
      }
    } else if (!allNotCompleted) {
      // Notify user that not all exercises are completed or skipped
      let userConfirmed = false;
      if (Platform.OS === "web") {
        userConfirmed = window.confirm(
          "Ikke alle øvelser er gjennomført. Ønsker du å lagre økten uansett?"
        );
      } else {
        Alert.alert(
          "Ikke fullførte øvelser",
          "Ikke alle øvelser er gjennomført. Ønsker du å lagre økten uansett?",
          [
            { text: "Avbryt", style: "cancel" },
            {
              text: "Ja",
              onPress: async () => {
                userConfirmed = true;
              },
            },
          ]
        );
      }

      if (userConfirmed) {
        // Update incomplete exercises to 'Skipped'
        const { error: updateError } = await supabase
          .from("user_exercises")
          .update({ status: "Skipped" })
          .eq("session_id", training_session.uS_id)
          .in("status", ["notCompleted"]); // Update exercises not yet completed or skipped

        if (updateError) {
          console.error("Error updating exercises to Skipped:", updateError);
          alert("Failed to update exercises.");
          return;
        }

        // Fetch updated exercises to determine session status
        const { data: updatedExercises, error: fetchError } = await supabase
          .from("user_exercises")
          .select("status")
          .eq("session_id", training_session.uS_id);

        if (fetchError) {
          console.error("Error fetching updated exercises:", fetchError);
          alert("Failed to update session.");
          return;
        }

        const allSkippedAfterUpdate = updatedExercises.every(
          (exercise) => exercise.status === "Skipped"
        );

        const allCompletedAfterUpdate = updatedExercises.every(
          (exercise) => exercise.status === "Completed"
        );

        let sessionStatusAfterUpdate = "Completed";

        if (allSkippedAfterUpdate) {
          sessionStatusAfterUpdate = "Skipped";
        } else if (!allCompletedAfterUpdate) {
          sessionStatusAfterUpdate = "Partial"; // Introduce 'Partial' status
        }

        const { error: sessionError } = await supabase
          .from("user_sessions")
          .update({ status: sessionStatusAfterUpdate })
          .eq("id", training_session.uS_id);

        if (sessionError) {
          console.error("Error updating session status:", sessionError);
          alert("Failed to save session.");
          return;
        }

        if (publishSession) {
          nav.navigate("PublishSession", { session: training_session });
        } else {
          nav.goBack();
        }
      }
    } else {
      // No exercises are completed or skipped
      alert("Du har ikke fullført noen øvelser.");
      // Optionally, set session status to 'Not Started' or leave as is
    }
  };

  const renderExercise: ListRenderItem<Exercise> = ({ item }) => {
    let statusText = "";
    if (item.status === "Completed") {
      statusText = "Fullført";
    } else if (item.status === "Skipped") {
      statusText = "Hoppet over";
    } else if (item.status === "Partial") {
      statusText = "Delvis fullført";
    }
    return (
      <Pressable
        style={styles.container}
        onPress={() =>
          nav.navigate("ExerciseDetail", {
            exercises: exercises,
            currentIndex: exercises.indexOf(item),
          })
        }
      >
        <View
          style={[
            styles.cardRow,
            item.status === "Completed" && styles.completedCard,
            item.status === "Skipped" && styles.skippedCard,
          ]}
        >
          {(item.status === "Completed" || item.status === "Skipped") && (
            <View
              style={
                item.status === "Completed"
                  ? styles.completedOverlay
                  : styles.skippedOverlay
              }
            />
          )}
          <Image
            source={{ uri: item.exercise_info.image_url }}
            style={styles.image}
          />
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{item.exercise_info.title}</Text>
            <View style={styles.details}></View>
            {item.status !== "notCompleted" && (
              <Text
                style={
                  item.status === "Completed" || item.status === "Partial"
                    ? styles.completedText
                    : styles.skippedText
                }
              >
                {statusText}
              </Text>
            )}
          </View>
          {item.status === "Completed" && (
            <Icon name="check-circle" size={24} style={styles.completedIcon} />
          )}
          {item.status === "Partial" && (
            <Icon
              name="check-circle-outline"
              size={24}
              style={[styles.completedIcon, { color: "green" }]}
            />
          )}
          {item.status === "Skipped" && (
            <Icon
              name="close-circle"
              size={24}
              style={[styles.completedIcon, { color: "grey" }]}
            />
          )}
        </View>
      </Pressable>
    );
  };
  return (
    <SafeAreaView style={styles.main}>
      <KeyboardAvoidingView style={styles.content}>
        <View style={[{ width: "80%" }]}>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.header}>{training_session.session_title}</Text>
            <Text style={styles.description}>
              {training_session.session_description}
            </Text>
          </View>
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExercise}
            ListEmptyComponent={<Text>No sessions found.</Text>}
          />
        </View>
        <Text style={styles.text}>Post økten:</Text>
        <View
          style={[
            { borderRadius: 20, marginRight: 10 },
            Platform.OS === "ios" && { borderWidth: 1 },
          ]}
        >
          <RadioButton
            value="publishSession"
            status={publishSession ? "checked" : "unchecked"}
            onPress={() => setPublishSession(!publishSession)}
          />
        </View>
        <Button label={"Lagre"} onPress={saveSession} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TrainingSession;
