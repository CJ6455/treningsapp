import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProgramsStackParamList } from "../navigationOptions";
import Programs from "../../app/client/Programs";
import WorkoutPlan from "../../app/client/modals/workoutPlan";
import TrainingSession from "../../app/client/modals/trainingSession";
import ExerciseDetail from "../../app/client/modals/exerciseDetail";
import PublishSession from "../../app/client/modals/publishSession";
import React from "react";
const Stack = createNativeStackNavigator<ProgramsStackParamList>();

const MessagesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Programs" component={Programs} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="WorkoutPlan" component={WorkoutPlan} />
        <Stack.Screen name="TrainingSession" component={TrainingSession} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
        <Stack.Screen name="PublishSession" component={PublishSession} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default MessagesStackNavigator;
