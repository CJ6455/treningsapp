import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  ListRenderItem,
} from "react-native";
import ThemedStyle from "../../../styleSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";

import { RadioButton } from "react-native-paper";
import { Button } from "../../../components/button";
import { supabase } from "../../../supabase";
import { Session } from "@supabase/supabase-js";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import trainingSession from "./trainingSession";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../../services/AuthContext";
import { ProgramsStackParamList } from "../../../navigation/navigationOptions";

export interface trainingSession {
  session_id: string;
  session_title: string;
  session_description: string;
  planned_date: Date;
  uS_id: string;
  uS_comment: string;
  status: string;
  uS_completed_at: Date;
}
const WorkoutPlan = () => {
  const styles = ThemedStyle();
  const route = useRoute();
  const { program } = route.params as { program: any };
  const [sessions, setSessions] = useState<trainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedTerm, setAcceptedTerm] = useState(false);
  const { session } = useAuth();
  const nav =
    useNavigation<NativeStackNavigationProp<ProgramsStackParamList>>();

  useEffect(() => {
    if (!session) return;

    const fetchSessions = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_sessions")
        .select(
          `
          *,
          training_sessions (
           *
          )
        `
        )
        .eq("assignment_id", program.id)
        .order("planned_date", { ascending: true })
        .limit(program.status === "pending" ? 3 : 1000);

      if (error) {
        console.error("Error fetching sessions:", error);
        setLoading(false);
        return;
      }

      const currentDate = new Date();

      const formattedSessions = await Promise.all(
        data.map(async (userSession: any) => {
          const sessionDetails = userSession.training_sessions;
          const plannedDate = new Date(userSession.planned_date);
          let statusUpdate = userSession.status;

          // Check if the planned date has passed and session is not already completed or skipped
          if (
            plannedDate < currentDate &&
            !["Completed", "Skipped", "Partial"].includes(statusUpdate)
          ) {
            // Fetch related exercises
            const { data: exercises, error: exercisesError } = await supabase
              .from("user_exercises")
              .select("status")
              .eq("session_id", userSession.id);

            if (exercisesError) {
              console.error("Error fetching exercises:", exercisesError);
              return {
                ...userSession,
                status: statusUpdate, // Keep original status if there's an error
              };
            }

            const allCompleted = exercises.every(
              (exercise: any) => exercise.status === "Completed"
            );
            const allSkipped = exercises.every(
              (exercise: any) => exercise.status === "Skipped"
            );

            if (allCompleted) {
              statusUpdate = "Completed";
            } else if (allSkipped) {
              statusUpdate = "Skipped";
            } else {
              statusUpdate = "Partial";
            }

            // Update the session status in the database
            const { error: updateError } = await supabase
              .from("user_sessions")
              .update({ status: statusUpdate })
              .eq("id", userSession.id);

            if (updateError) {
              console.error("Error updating session status:", updateError);
            }
          }

          return {
            session_id: sessionDetails.id,
            session_title: sessionDetails.title,
            session_description: sessionDetails.description,
            planned_date: userSession.planned_date,
            uS_id: userSession.id,
            uS_comment: userSession.comment,
            status: statusUpdate,
            uS_completed_at: userSession.completed_at,
          };
        })
      );

      setSessions(formattedSessions);
      setLoading(false);
    };

    fetchSessions();
  }, [program, session]);

  const updateSession = (payload: any) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.uS_id === payload.new.id
          ? {
              ...session,
              // Merge only the fields that might have changed
              planned_date: payload.new.planned_date ?? session.planned_date,
              uS_comment: payload.new.comment ?? session.uS_comment,
              status: payload.new.status ?? session.status,
              uS_completed_at:
                payload.new.completed_at ?? session.uS_completed_at,
              // Keep existing training session data
              session_id: session.session_id,
              session_title: session.session_title,
              session_description: session.session_description,
            }
          : session
      )
    );
  };

  useEffect(() => {
    if (!program.id) return;
    const channel = supabase
      .channel(`user_sessions:assignment_id=eq.${program.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_sessions",
          filter: `assignment_id=eq.${program.id}`,
        },
        updateSession
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [program.id]);

  const handlePurchase = () => {
    Platform.OS === "web"
      ? Alert.alert(
          "Kjøp bekreftelse",
          "Er du sikker på at du vil kjøpe programmet?"
        )
      : alert("Er du sikker på at du vil kjøpe programmet?");
  };
  const renderSessionItem: ListRenderItem<trainingSession> = ({ item }) => {
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
          nav.navigate("TrainingSession", { training_session: item })
        }
      >
        <Text style={styles.dateText}>
          {new Date(item.planned_date).toLocaleDateString()}
        </Text>
        <View
          style={[
            styles.cardColumn,
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
          <Text style={styles.title}>{item.session_title}</Text>
          <Text style={styles.description}>{item.session_description}</Text>
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

  // Show loading indicator if fetching
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaView style={styles.main}>
      <Text style={styles.header}>{program.workout_plan.title}</Text>
      <Text style={styles.description}>{program.workout_plan.description}</Text>
      <Text style={[styles.title]}>TreningsØkter:</Text>
      <View style={{ width: "80%" }}>
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.uS_id}
          renderItem={renderSessionItem}
          ListEmptyComponent={<Text>No sessions found.</Text>}
        />
      </View>
      {program.status === "pending" && (
        <View style={{ width: "100%", margin: 20, padding: 10 }}>
          <Text style={[styles.text, { fontWeight: "bold" }]}>Pris</Text>
          <Text style={styles.text}>{program.price} kr</Text>
          <Text style={[styles.text, { fontWeight: "bold", marginTop: 20 }]}>
            Vilkår
          </Text>
          <ScrollView
            style={{
              height: 250,
              borderWidth: 1,
              padding: 5,
            }}
          >
            <Text style={styles.text}>
              Når du bestiller treningsprogram hos oss, godtar du samtidig de
              vilkår og betingelser som foreligger. Du bør lese gjennom disse
              før du bestiller. Vilkårene kan endres uten varsel, og du er
              forpliktet til selv å holde deg oppdatert om eventuelle endringer.
              <Text style={{ fontWeight: "bold" }}>
                {"\n"}
                {"\n"}Produktet{"\n"}
              </Text>
              Du må være fylt 18 år for å kunne bestille skreddersydd
              treningsprogram hos oss. Vi tilbyr skreddersydde treningsprogram
              utarbeidet av et kvalifisert treningsteam, og med online
              oppfølging.
              <Text style={{ fontWeight: "bold" }}>
                {"\n"}
                {"\n"}Betaling{"\n"}
              </Text>
              Programmet forhåndsbetales i appen. Angrerett Det er ingen
              angrerett på kjøpet etter at du har godtatt betingelsene og kjøpt
              treningsprogrammet.
              <Text style={{ fontWeight: "bold" }}>
                {"\n"}
                {"\n"}Oppbevaring av dine personlige opplysninger{"\n"}
              </Text>
              All informasjon vi mottar fra deg for å kunne lage et skreddersydd
              treningsprogram blir behandlet på en trygg og sikker måte.
              Kundedata blir ikke delt med eller solgt til en tredje part og
              oppbevares i henhold til norsk lov. All informasjon håndteres
              konfidensielt, og ingen data vil bli solgt/delt med 3. Part i
              henhold til norsk lov.{" "}
              <Text style={{ fontWeight: "bold" }}>
                {"\n"}
                {"\n"}Ansvarsfraskrivelse{"\n"}
              </Text>
              Det er kundens eget ansvar å påse at all informasjon som deles med
              oss er korrekt, og at all relevant og viktig informasjon angående
              eventuelle helserelaterte problemer blir oppgitt. Trine Trim AS
              kan ikke stilles til ansvar for skader eller andre helseproblemer
              som oppstår i forbindelse med treningen.{" "}
              <Text style={{ fontWeight: "bold" }}>
                {"\n"}
                {"\n"}Kopiering/deling{"\n"}
              </Text>{" "}
              Alt materiale og innhold i denne tjenesten eies av Trine Trim AS.
              Våre program er skreddersydde kun for den aktuelle kunden, og
              kopiering eller deling av materiale og/eller innhold for bruk
              annet sted er ikke tillatt.
            </Text>

            <View
              style={{
                flexDirection: "row",
                margin: 10,
                paddingBottom: 10,
                alignItems: "center",
              }}
            >
              <View
                style={[
                  { borderRadius: 20, marginRight: 10 },
                  Platform.OS === "ios" && { borderWidth: 1 },
                ]}
              >
                <RadioButton
                  value="acceptTerms"
                  status={acceptedTerm ? "checked" : "unchecked"}
                  onPress={() => setAcceptedTerm(!acceptedTerm)}
                />
              </View>
              <Text style={styles.text}>Jeg godtar vilkårene</Text>
            </View>
          </ScrollView>
          {acceptedTerm ? (
            <Button label="Kjøp program" onPress={handlePurchase} />
          ) : (
            <Text style={[styles.text, { opacity: 0.5, marginTop: 10 }]}>
              Godta vilkårene for å kjøpe programmet
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default WorkoutPlan;
