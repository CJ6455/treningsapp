import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  SectionList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ThemedStyle from "../../styleSheet";
import { supabase } from "../../supabase";
import { Session } from "@supabase/supabase-js";
import { format, isAfter, parseISO, set } from "date-fns";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { IconButton } from "../../components/iconButton";
import { useAuth } from "../../services/AuthContext";
import { AppointmentsStackParamList } from "../../navigation/navigationOptions";
const Appointments = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const styles = ThemedStyle();
  const nav =
    useNavigation<NativeStackNavigationProp<AppointmentsStackParamList>>();
  const [appointments, setAppointments] = useState<any>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any>([]);
  const [pastAppointments, setPastAppointments] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const { session } = useAuth();

  // Helper function to get client_id based on user_id
  useEffect(() => {
    const getClientId = async () => {
      if (!session) {
        return;
      }
      try {
        const { data, error } = await supabase.rpc("get_client_id", {
          p_user_id: session.user.id,
        });

        if (error) {
          console.error("Error fetching client ID:", error);
          return;
        }

        setClientId(data);
      } catch (error) {
        console.error("Unexpected error fetching client ID:", error);
        return;
      }
    };
    getClientId();
  }, [session]);
  // Fetch appointments function
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      if (!session || !clientId) {
        // Handle unauthenticated user

        return;
      }

      // Fetch appointments where client_id corresponds to the current user
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          specialist_id,
          scheduled_at,
          ends_at,
          created_at,
          specialists (
            id,
            bio,
           
            profiles(
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("client_id", clientId)
        .order("scheduled_at", { ascending: true }); // Latest first

      if (error) {
        throw error;
      }
      console.log(data);
      setAppointments(data);

      // Categorize appointments
      const now = new Date();
      const upcoming = data.filter((app) =>
        isAfter(new Date(app.scheduled_at), now)
      );
      const past = data.filter(
        (app) => !isAfter(new Date(app.scheduled_at), now)
      );

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      alert("Noe gikk galt ved henting av avtaler. Vennligst prøv igjen.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  //  fetch appointments on mount
  useEffect(() => {
    if (!clientId) return;
    // Subscribe to realtime changes
    fetchAppointments();
    const subscription = supabase
      .channel(`appointments:client_id=eq.${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `client_id=eq.${clientId}`,
        },
        fetchAppointments
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [clientId]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, [session]);

  // Render Appointment Item
  const renderAppointment = ({ item }: any) => {
    const startTime = parseISO(item.scheduled_at);
    const endTime = parseISO(item.ends_at);

    return (
      <View style={styles.appointmentCard}>
        <Text style={styles.appointmentSpecialist}>
          {item.specialists.profiles.full_name}
        </Text>
        <Text style={styles.appointmentTime}>
          {format(startTime, "dd MMM yyyy, HH:mm")} - {format(endTime, "HH:mm")}
        </Text>
        <Text style={styles.appointmentBio}>{item.specialists.bio}</Text>
        {/* Add more details or actions as needed */}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.main}>
      <Text style={styles.header}>Mine Avtaler</Text>
      <IconButton
        name="plus-square"
        size={24}
        onPress={() => nav.navigate("CreateAppointment")}
      />

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#1EB1FC"
          style={{ marginTop: 20 }}
        />
      ) : (
        <SectionList
          sections={[
            {
              title: "Kommende Avtaler",
              data: upcomingAppointments,
            },
            {
              title: "Tidligere Avtaler",
              data: pastAppointments,
            },
          ]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderAppointment({ item })}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.title}>{title}</Text>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.noAppointmentsText}>
                Ingen avtaler funnet.
              </Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

export default Appointments;
