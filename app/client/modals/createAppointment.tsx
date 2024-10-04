import {
  View,
  Text,
  KeyboardAvoidingView,
  FlatList,
  Image,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "../../../components/iconButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { supabase } from "../../../supabase";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/button";
import Slider from "@react-native-community/slider";
import DropDownList, { DDLItem } from "../../../components/dropdownList";
import ThemedStyle from "../../../styleSheet";
import downloadImage from "../../../api/imageStorage";
import debounce from "lodash.debounce";
import { set } from "lodash";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../../../services/AuthContext";
import { ProgramsStackParamList } from "../../../navigation/navigationOptions";

const CreateAppointment = () => {
  const nav =
    useNavigation<NativeStackNavigationProp<ProgramsStackParamList>>();
  const [selectedType, setSelectedType] = useState<any | null>([]);
  const styles = ThemedStyle();
  const [userLocation, setUserLocation] = useState<any | null>(null);
  const [radius, setRadius] = useState(10); // Default to 10 km
  const [specialists, setSpecialists] = useState<any | null>([]);
  const [loading, setLoading] = useState(false);
  const [specialistTypes, setSpecialistTypes] = useState<DDLItem[] | null>(
    null
  );
  const { session } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchSpecialistTypes = async () => {
      const { data, error } = await supabase
        .from("specialist_types")
        .select("*");
      if (error) {
        console.error("Error fetching specialist types:", error);
        return;
      }

      const types = data.map((item) => ({
        name: item.name,
        id: item.id,
        icon: "account",
      }));

      setSpecialistTypes(types);
    };
    getUserLocation();
    fetchSpecialistTypes();
  }, []);

  const getUserLocation = async () => {
    try {
      if (Platform.OS !== "web") {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          alert("Permission to access location was denied");
          return null;
        }
      }
      // Attempt to get the last known position
      let cachedLocation = await Location.getLastKnownPositionAsync({});
      if (cachedLocation) {
        setUserLocation(cachedLocation.coords);
        return;
      }

      // Fallback to getting the current position if no cached location
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error("Error getting user location:", error);
    }
  };

  const fetchSpecialists = async (
    selectedType: string,
    latitude: any,
    longitude: any,
    radiusInKm: number
  ) => {
    if (!latitude || !longitude || !selectedType) {
      return [];
    }

    const radiusInMeters = radiusInKm * 1000;
    setLoading(true);
    const { data, error } = await supabase.rpc(
      "get_specialists_with_distance",
      {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius_meters: radiusInMeters,
        p_specialist_type_id: selectedType,
      }
    );
    // Limit results for performance

    if (error) {
      console.error("Error fetching specialists:", error);
      return [];
    }

    if (data) {
      // Use Promise.all with map to handle async image downloads
      const specialistProfiles = await Promise.all(
        data.map(async (profile: any) => {
          const imageUrl = await downloadImage("avatars", profile.avatar_url);
          return {
            ...profile,
            avatar_url: imageUrl,
          };
        })
      );

      setSpecialists(specialistProfiles);
      setLoading(false);
    }
  };

  const debouncedFetchSpecialists = useCallback(
    debounce((typeId, lat, lon, rad) => {
      fetchSpecialists(typeId, lat, lon, rad);
    }, 200), // 500 milliseconds delay
    []
  );
  useEffect(() => {
    if (!userLocation || !selectedType) {
      return;
    }
    debouncedFetchSpecialists(
      selectedType.id,
      userLocation.latitude,
      userLocation.longitude,
      radius
    );
  }, [
    userLocation,
    selectedType,
    radius,
    selectedDate,
    debouncedFetchSpecialists,
  ]);

  useEffect(() => {
    return () => {
      debouncedFetchSpecialists.cancel();
    };
  }, [debouncedFetchSpecialists]);

  const fetchAvailableTimeSlots = async (specialistId: string, date: Date) => {
    setLoadingTimeSlots(true);

    const formattedDate = date.toISOString().split("T")[0]; // 'YYYY-MM-DD'

    const { data, error } = await supabase.rpc("get_available_time_slots", {
      p_specialist_id: specialistId,
      p_date: formattedDate,
    });

    if (error) {
      console.error("Error fetching available time slots:", error);
      setAvailableTimeSlots([]);
    } else {
      setAvailableTimeSlots(
        data.map((slot: any) => slot.time_slot.slice(0, 5))
      );
    }

    setLoadingTimeSlots(false);
  };
  const handleSpecialistSelect = (id: string) => {
    setSelectedSpecialist(id);
    fetchAvailableTimeSlots(id, selectedDate);
  };
  const handleTimeSlotSelect = (time: any) => {
    setSelectedTimeSlot(time);
  };
  const getClientId = async () => {
    if (!session) {
      return null;
    }
    try {
      const { data, error } = await supabase.rpc("get_client_id", {
        p_user_id: session.user.id,
      });
      //get_client_id creates a new client if one does not exist

      if (error) {
        console.error("Error fetching client ID:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Unexpected error fetching client ID:", error);
      return null;
    }
  };

  const bookAppointment = async () => {
    if (!selectedType || !selectedDate || !selectedTimeSlot) {
      alert("Vennligst velg en behandler, dato og tid.");
      return;
    }
    if (!session) {
      alert("Du må logge inn for å booke en avtale.");
      return;
    }

    try {
      const clientId = await getClientId();
      if (!clientId) {
        alert("Ingen klient informasjon funnet.");
        return;
      }
      const formattedDate = selectedDate.toISOString().split("T")[0];

      const { error } = await supabase.rpc("book_appointment", {
        p_specialist_id: selectedSpecialist,
        p_client_id: clientId,
        p_date: formattedDate,
        p_time_slot: selectedTimeSlot,
      });

      if (error) {
        console.error("Error booking appointment:", error);
        alert("Noe gikk galt ved booking av avtale. Vennligst prøv igjen.");
      } else {
        alert("Avtalen din er booket!");
        // Optionally, navigate to a confirmation screen or reset selections
        nav.goBack();
        setSelectedTimeSlot(null);
        // Refresh available time slots
        fetchAvailableTimeSlots(selectedType.id, selectedDate);
      }
    } catch (error) {
      console.error("Unexpected error booking appointment:", error);
      alert("Noe gikk galt ved booking av avtale. Vennligst prøv igjen.");
    }
  };

  return (
    <SafeAreaView style={styles.main}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={[styles.container, { flex: 1 }]}>
          <Text style={styles.header}>Velg behandler:</Text>
          <Text>
            Finn en fagperson som passer dine behov og din hverdag og book en
            konsultasjon
          </Text>
          <Text>
            Fagpersonen vil kartlegge behovene dine og sette opp en avtale slik
            at dere kan lage et program som passer for deg
          </Text>

          <Text>Hva ser du etter?</Text>

          {specialistTypes && (
            <View style={{ marginBottom: 20 }}>
              <DropDownList
                label="Velg type fagperson"
                data={specialistTypes}
                onSelect={setSelectedType}
              />
            </View>
          )}

          <Text>Hvor langt er du villig til å reise?</Text>

          {/* <Button label="Bruk posisjonen min" onPress={getUserLocation} /> */}

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Avstand: {radius} km</Text>
            <Slider
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor="#1EB1FC"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#1EB1FC"
            />
          </View>

          {/* <Button label="Søk etter behandlere" onPress={handleSearch} /> */}
          {loading ? (
            <ActivityIndicator size="large" color="#1EB1FC" />
          ) : (
            <>
              <FlatList
                style={styles.listContainer}
                data={specialists}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() =>
                      !selectedSpecialist
                        ? handleSpecialistSelect(item.id)
                        : setSelectedSpecialist(null)
                    }
                  >
                    <View
                      style={[
                        styles.specialistCard,
                        item.id === selectedSpecialist && {
                          borderWidth: 1,
                          borderColor: "blue",
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: item.avatar_url }}
                        style={[styles.image, { marginBottom: 20 }]}
                      />
                      <Text style={styles.specialistName}>
                        {item.full_name}
                      </Text>
                      <Text style={styles.specialistBio}>{item.bio}</Text>

                      {item.distance !== undefined && (
                        <Text style={styles.specialistDistance}>
                          Avstand: {(item.distance / 1000).toFixed(2)} km
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.loadingText}>
                    Ingen fagpersoner som passer kriteriene dine ble funnet.
                  </Text>
                }
              />
            </>
          )}
          {selectedSpecialist && (
            <View style={styles.datePickerContainer}>
              <Text style={styles.title}>Velg dato for avtalen:</Text>

              {Platform.OS !== "web" && (
                <>
                  {showDatePicker && (
                    <IconButton
                      name="calendar"
                      size={24}
                      onPress={() =>
                        showDatePicker
                          ? setShowDatePicker(false)
                          : setShowDatePicker(true)
                      }
                    />
                  )}
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedDate}
                    mode="date"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selected) => {
                      setShowDatePicker(false);
                      if (selected) {
                        setSelectedDate(selected);
                        if (selectedSpecialist) {
                          fetchAvailableTimeSlots(selectedSpecialist, selected);
                        }
                      }
                    }}
                  />
                </>
              )}
              {Platform.OS === "web" && (
                <input
                  style={{
                    backgroundColor: "white",

                    margin: 10,
                    borderWidth: 2,
                    borderRadius: 10,
                    padding: 10,
                  }}
                  type="date"
                  value={selectedDate?.toISOString().substring(0, 10)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(selectedDate || new Date());
                      const [year, month, day] = e.target.value.split("-");
                      newDate.setFullYear(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day)
                      );
                      setSelectedDate(newDate);
                    } else {
                      setSelectedDate(new Date()); // Clear the date if input is cleared
                    }
                  }}
                />
              )}
              {selectedDate && Platform.OS !== "web" && (
                <Text>{selectedDate.toDateString()}</Text>
              )}

              <View style={styles.timeSlotsContainer}>
                <Text style={styles.title}>Velg en tid:</Text>

                {loadingTimeSlots ? (
                  <ActivityIndicator size="small" color="#1EB1FC" />
                ) : availableTimeSlots.length > 0 ? (
                  <FlatList
                    data={availableTimeSlots}
                    keyExtractor={(item) => item}
                    horizontal
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.timeSlotButton}
                        onPress={() => handleTimeSlotSelect(item)}
                      >
                        <Text style={styles.timeSlotText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                  />
                ) : (
                  <Text style={styles.noSlotsText}>
                    Ingen tilgjengelige tider for denne datoen.
                  </Text>
                )}
              </View>
            </View>
          )}
          {selectedTimeSlot && (
            <Button label="Book avtale" onPress={bookAppointment} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateAppointment;
