import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import ThemedStyle from "../../styleSheet";
import { IconButton } from "../../components/iconButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

const Activities = () => {
  const style = ThemedStyle();
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  // const [appointments, setAppointments] = useState<Appointment[]>([]);

  // const [exercises, setExercises] = useState<Appointment[]>([]);

  // const [meals, setMeals] = useState<Appointment[]>([]);

  // const [refreshing, setRefreshing] = useState(true);
  // const fetchActivities = async () => {
  //   // Fetch activities from the database
  //   try {
  //     const fetchedAppointments = await getAppointments();

  //     setAppointments(fetchedAppointments);
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setRefreshing(false);
  //   }
  // };
  // useEffect(() => {
  //   fetchActivities();
  // }, []);

  // const onRefresh = () => {
  //   fetchActivities();
  // };

  return (
    <SafeAreaView style={style.main}>
      <View style={style.topSection}>
        <Text style={[style.header, style.secondaryColor]}>Aktiviteter</Text>
      </View>
      {/* <ScrollView
        style={layout.content}
        contentContainerStyle={{ alignItems: "center" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {refreshing ? <ActivityIndicator /> : null}
        <View style={layout.activitySection}>
          <View style={layout.activitySectionTop}>
            <Text style={[style.text, { marginLeft: 10, fontSize: 20 }]}>
              Avtaler
            </Text>
            <View style={{}}>
              <IconButton
                name="plus-square"
                size={24}
                onPress={() => nav.navigate("CreateAppointment")}
              />
            </View>
          </View>

          <ScrollView style={layout.horizontalScroll} horizontal>
            {appointments.length > 0 ? (
              <AppointmentSection data={appointments} />
            ) : (
              <Text
                style={[
                  style.text,
                  {
                    alignSelf: "center",
                    marginLeft: 40,
                    opacity: 0.5,
                    fontSize: 20,
                  },
                ]}
              >
                Du har ingen avtaler idag
              </Text>
            )}
          </ScrollView>
        </View>
        <View style={layout.activitySection}>
          <View style={layout.activitySectionTop}>
            <Text style={[style.text, { marginLeft: 10, fontSize: 20 }]}>
              Øvelser
            </Text>
            <View style={{}}>
              <IconButton
                name="plus-square"
                size={24}
                onPress={() => nav.navigate("CreateExercise")}
              />
            </View>
          </View>

          <ScrollView style={layout.horizontalScroll} horizontal>
            {0 > 0 ? (
              <AppointmentSection data={appointments} />
            ) : (
              <Text
                style={[
                  style.text,
                  {
                    alignSelf: "center",
                    marginLeft: 40,
                    opacity: 0.5,
                    fontSize: 20,
                  },
                ]}
              >
                Du har ingen øvelser idag
              </Text>
            )}
          </ScrollView>
        </View>
        <View style={layout.activitySection}>
          <View style={layout.activitySectionTop}>
            <Text style={[style.text, { marginLeft: 10, fontSize: 20 }]}>
              Måltider
            </Text>
            <View style={{}}>
              <IconButton
                name="plus-square"
                size={24}
                onPress={() => nav.navigate("CreateAppointment")}
              />
            </View>
          </View>

          <ScrollView style={layout.horizontalScroll} horizontal>
            {0 > 0 ? (
              <AppointmentSection data={appointments} />
            ) : (
              <Text
                style={[
                  style.text,
                  {
                    alignSelf: "center",
                    marginLeft: 40,
                    opacity: 0.5,
                    fontSize: 20,
                  },
                ]}
              >
                Du har ingen måltider idag
              </Text>
            )}
          </ScrollView>
        </View>
      </ScrollView> */}
    </SafeAreaView>
  );
};

const layout = StyleSheet.create({
  activitySection: {
    width: "100%",
    flex: 1,
  },
  activitySectionTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    width: "100%",
    height: "100%",
    flexDirection: "column",
  },
  horizontalScroll: {
    width: "100%",
    flex: 1,
  },
});

export default Activities;
