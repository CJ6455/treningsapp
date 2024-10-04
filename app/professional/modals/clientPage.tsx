import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { User } from "../../common/Settings";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ClientPageStackParamList } from "../../../navigation/navigationOptions";
import ThemedStyle from "../../../styleSheet";
import { Image } from "expo-image";
import { Client } from "../clients";

import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import fetchWorkoutPlans from "../../../api/getWorkoutPlans";
import { WorkoutPlan } from "../../client/Programs";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
const ClientPage = () => {
  const route = useRoute();
  const nav =
    useNavigation<NativeStackNavigationProp<ClientPageStackParamList>>();
  const colorStyle = ThemedStyle();
  const { client } = route.params as { client: Client };
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  useEffect(() => {
    const getWorkoutPlans = async () => {
      const plans = await fetchWorkoutPlans(client.client_id);
      console.log(plans);
      if (plans) {
        setWorkoutPlans(plans);
      }
    };
    getWorkoutPlans();
  }, [client]);
  return (
    <SafeAreaView style={colorStyle.main}>
      <View style={style.content}>
        <Image
          source={{ uri: client.user_info.avatar_url }}
          style={style.avatar}
        />

        <Text style={[colorStyle.text, colorStyle.header, { marginTop: 10 }]}>
          {client.user_info.full_name}
        </Text>

        <Text style={colorStyle.text}>Treningsplaner:</Text>
        <FlatList
          data={workoutPlans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable>
              <View
                style={[
                  colorStyle.cardColumn,
                  item.status === "completed" && colorStyle.completedCard,
                ]}
              >
                {item.status === "completed" && (
                  <View style={colorStyle.completedOverlay} />
                )}
                <Text style={colorStyle.title}>{item.workout_plan.title}</Text>
                <Text style={colorStyle.description}>
                  {item.workout_plan.description}
                </Text>
                {}
                <Text
                  style={[
                    colorStyle.statusText,
                    item.status === "pending" && colorStyle.pendingStatus,
                    item.status === "completed" && [
                      colorStyle.completedStatus,
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
                  <Icons
                    name="check-circle"
                    size={24}
                    style={colorStyle.completedIcon}
                  />
                )}
              </View>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  avatar: {
    width: 200,
    height: 200,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});

export default ClientPage;
