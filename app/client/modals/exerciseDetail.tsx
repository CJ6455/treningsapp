// ExerciseDetail.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Touchable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import ThemedStyle from "../../../styleSheet";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Button } from "../../../components/button";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { supabase } from "../../../supabase";

import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../services/AuthContext";
import { ProgramsStackParamList } from "../../../navigation/navigationOptions";
import { Exercise } from "./trainingSession";

import Swiper from "react-native-swiper";
import { set } from "date-fns";
// Define the interface for user_exercise_sets
interface UserExerciseSet {
  id: string; // UUID
  user_exercise_id: string; // UUID
  set_number: number;
  planned_reps: number;
  actual_reps: number | null;
  planned_weight: number | null;
  actual_weight: number | null;
  comment: string | null;
}

const ExerciseDetail = () => {
  // const styles = ThemedStyle();
  const route = useRoute();
  const { exercises, currentIndex } = route.params as {
    exercises: Exercise[];
    currentIndex: number;
  };
  const [performanceData, setPerformanceData] = useState<{
    [key: string]: UserExerciseSet[];
  }>({});
  const nav =
    useNavigation<NativeStackNavigationProp<ProgramsStackParamList>>();
  const { session } = useAuth();
  const colorStyle = ThemedStyle();
  const [showInstructions, setShowInstructions] = useState(false);

  const [index, setIndex] = useState<number>(currentIndex);
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const performanceDataRef = useRef(performanceData);
  const commentsRef = useRef(comments);

  useEffect(() => {
    const initialComments: { [key: string]: string } = {};
    exercises.forEach((exercise) => {
      initialComments[exercise.id] = exercise.comment || "";
    });
    setComments(initialComments);
  }, [exercises]);

  useEffect(() => {
    performanceDataRef.current = performanceData;
  }, [performanceData]);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    const fetchAllPerformanceData = async () => {
      const dataMap: Record<string, UserExerciseSet[]> = {};

      for (const exercise of exercises) {
        const { data, error } = await supabase
          .from("user_exercise_sets")
          .select("*")
          .eq("user_exercise_id", exercise.id);

        if (error) {
          console.error("Error fetching performance data:", error);
          dataMap[exercise.id] = [];
          continue;
        }

        dataMap[exercise.id] = data.map((set: any) => ({
          id: set.id,
          user_exercise_id: set.user_exercise_id,
          set_number: set.set_number,
          planned_reps: set.planned_reps,
          actual_reps: set.actual_reps,
          planned_weight: set.planned_weight,
          actual_weight: set.actual_weight,
          comment: set.comment,
        }));
      }
      setPerformanceData(dataMap);
    };

    fetchAllPerformanceData();
  }, [exercises]);

  const updatePerformanceData = (
    exerciseId: string,
    setIndex: number,
    field: keyof UserExerciseSet,
    value: any
  ) => {
    setPerformanceData((prevData) => {
      // Copy the performance data array for the specific exercise
      const updatedExerciseData = [...(prevData[exerciseId] || [])];
      // Update the specific set within the exercise
      updatedExerciseData[setIndex] = {
        ...updatedExerciseData[setIndex],
        [field]: value,
      };
      // Return the updated performanceDataMap
      return {
        ...prevData,
        [exerciseId]: updatedExerciseData,
      };
    });
  };

  const savePerformanceData = React.useCallback(
    async (
      exerciseItem: Exercise,
      currentPerformanceData: UserExerciseSet[],
      currentComment: string
    ) => {
      if (!session) return;
      try {
        const currentExerciseId = exerciseItem.id;

        // Check if all fields are blank
        const isAllFieldsBlank = currentPerformanceData.every(
          (set) =>
            (set.actual_reps === null || set.actual_reps === undefined) &&
            (set.actual_weight === null || set.actual_weight === undefined)
        );

        // Check if there are incomplete sets (missing reps or weight)
        const hasIncompleteSets = currentPerformanceData.some(
          (set) =>
            set.actual_reps === null ||
            set.actual_reps === undefined ||
            set.actual_weight === null ||
            set.actual_weight === undefined
        );

        let status = "Completed";
        if (isAllFieldsBlank) {
          status = "Skipped";
        } else if (hasIncompleteSets) {
          status = "Partial";
        }

        // Save performance data
        const { error: setError } = await supabase
          .from("user_exercise_sets")
          .upsert(currentPerformanceData);

        if (setError) {
          console.error("Error saving performance data:", setError);
          // Handle error as needed
          return;
        }

        // Save exercise status and comment
        const { error: exError } = await supabase
          .from("user_exercises")
          .update({ status: status, comment: currentComment })
          .eq("id", currentExerciseId);

        if (exError) {
          console.error("Error saving exercise data:", exError);
          // Handle error as needed
          return;
        }

        // Optionally, provide feedback
        // Alert.alert(`Exercise ${status.toLowerCase()} successfully!`);
      } catch (error) {
        console.error("Error during save operation:", error);
        // Handle error as needed
      }
    },
    [session]
  );

  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused

      return () => {
        // Screen is unfocused (modal is closed)
        const currentExercise = exercises[index];
        const currentPerformanceData =
          performanceDataRef.current[currentExercise.id] || [];
        const currentComment = commentsRef.current[currentExercise.id] || "";

        savePerformanceData(
          currentExercise,
          currentPerformanceData,
          currentComment
        );
      };
    }, [exercises, index, savePerformanceData])
  );

  return (
    <Swiper
      loop={false}
      index={index}
      onIndexChanged={(newIndex) => {
        const currentExercise = exercises[index];
        const currentPerformanceData =
          performanceData[currentExercise.id] || [];
        const currentComment = comments[currentExercise.id] || "";
        savePerformanceData(
          currentExercise,
          currentPerformanceData,
          currentComment
        );
        setIndex(newIndex);
      }}
      showsPagination={true}
    >
      {exercises.map((exerciseItem, idx) => (
        <View key={exerciseItem.id} style={{ flex: 1 }}>
          <SafeAreaView style={[colorStyle.main, { flex: 1 }]}>
            <KeyboardAvoidingView
              style={{
                flex: 1,
                width: "100%",
              }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Exercise Information */}
                <Text style={[colorStyle.header, { alignSelf: "center" }]}>
                  {exerciseItem.exercise_info.title}
                </Text>

                {/* Embed YouTube Video */}

                <Image
                  source={{ uri: exerciseItem.exercise_info.image_url }}
                  style={{ width: 200, aspectRatio: 1, alignSelf: "center" }}
                />
                <TouchableOpacity
                  style={{
                    marginLeft: 30,
                    marginTop: 20,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    width: "40%",
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onPress={() => setShowInstructions(!showInstructions)}
                >
                  <Text>Instructions</Text>
                  {showInstructions ? (
                    <MaterialIcons
                      name="arrow-drop-up"
                      size={24}
                      color="black"
                    />
                  ) : (
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="black"
                    />
                  )}
                </TouchableOpacity>
                {showInstructions && (
                  <Text style={[styles.description, colorStyle.text]}>
                    {exerciseItem.exercise_info.description}
                  </Text>
                )}
                {/* Performance Tracking */}
                <View style={styles.tableRow}>
                  <Text style={[styles.rowText, colorStyle.text]}>Set</Text>
                  <Text style={[styles.rowText, colorStyle.text]}>
                    Planned reps
                  </Text>
                  <Text style={[styles.rowText, colorStyle.text]}>Reps</Text>
                  <Text style={[styles.rowText, colorStyle.text]}>Weight</Text>
                </View>

                {(performanceData[exerciseItem.id] || []).map((set, index) => (
                  <View key={set.id} style={styles.tableRow}>
                    <Text style={[styles.rowText, colorStyle.text]}>
                      {set.set_number}
                    </Text>
                    <Text style={[styles.rowText, colorStyle.text]}>
                      {set.planned_reps}
                    </Text>
                    <TextInput
                      style={[styles.input, colorStyle.text]}
                      keyboardType="numeric"
                      value={
                        set.actual_reps !== null
                          ? set.actual_reps.toString()
                          : ""
                      }
                      onChangeText={(value) =>
                        updatePerformanceData(
                          exerciseItem.id,
                          index,
                          "actual_reps",
                          value ? parseFloat(value) : null
                        )
                      }
                    />
                    <TextInput
                      style={[styles.input, colorStyle.text]}
                      keyboardType="numeric"
                      value={
                        set.actual_weight !== null
                          ? set.actual_weight.toString()
                          : ""
                      }
                      onChangeText={(value) =>
                        updatePerformanceData(
                          exerciseItem.id,
                          index,
                          "actual_weight",
                          value ? parseFloat(value) : null
                        )
                      }
                    />
                  </View>
                ))}

                <View style={{ marginLeft: 30 }}>
                  <Text style={colorStyle.text}>Comment:</Text>
                  <TextInput
                    style={[
                      styles.input,
                      colorStyle.text,
                      { marginRight: 5, marginLeft: 0, marginTop: 10 },
                    ]}
                    value={comments[exerciseItem.id] || ""}
                    onChangeText={(value) => {
                      setComments((prevComments) => ({
                        ...prevComments,
                        [exerciseItem.id]: value,
                      }));
                    }}
                  />
                </View>

                {/* Actions */}
                <View style={styles.buttonContainer}></View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      ))}
    </Swiper>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: "100%",
  },

  description: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  videoContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: "red",
  },

  setTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,

    flex: 1,
  },
  value: {
    fontSize: 16,

    flex: 1,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    flex: 0.5,
    marginHorizontal: 5,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    alignItems: "center",
  },
  rowText: {
    flex: 1,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
});
export default ExerciseDetail;
