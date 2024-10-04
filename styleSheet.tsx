import { StyleSheet, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { color } from "@rneui/themed/dist/config";
const lightColors = {
  background: "#F5F5F5", // Light gray for a soft, neutral background
  text: "#212121", // Dark gray instead of pure black for better readability
  secondary: "#1976D2", // Vibrant blue for secondary elements
  cardBackground: "#FFFFFF", // Pure white for cards to create contrast
  cardShadow: "rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
  cardBorder: "#E0E0E0", // Light gray border for subtle separation
  successText: "#388E3C", // Rich green for success messages
  errorText: "#D32F2F", // Bold red for error messages
  completedBackground: "#DFF0D8", // Light green background for completed items
  completedOverlay: "rgba(0, 0, 0, 0.05)", // Very subtle overlay
  skippedBackground: "#F0F0F0", // Light gray background for skipped items
  skippedOverlay: "rgba(0, 0, 0, 0.1)", // Slightly more opaque overlay
};
const darkColors = {
  background: "#121212", // Very dark gray for a sleek, modern look
  text: "#E0E0E0", // Light gray for high contrast against dark backgrounds
  secondary: "#BB86FC", // Soft purple for secondary elements, aligning with Material Design
  cardBackground: "#1E1E1E", // Dark gray for cards to blend with the background
  cardShadow: "rgba(255, 255, 255, 0.1)", // Light shadow for subtle depth
  cardBorder: "#333333", // Dark gray border for consistency
  successText: "#81C784", // Softer green for success messages
  errorText: "#E57373", // Muted red for error messages
  completedBackground: "#2E7D32", // Darker green background for completed items
  completedOverlay: "rgba(255, 255, 255, 0.05)", // Very subtle overlay
  skippedBackground: "#424242", // Medium dark gray for skipped items
  skippedOverlay: "rgba(255, 255, 255, 0.1)", // Slightly more opaque overlay
};

export const ThemedStyle = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  return StyleSheet.create({
    main: {
      width: "100%",
      height: "100%",
      justifyContent: "flex-start",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    tabs: {
      position: "absolute",
      bottom: 0,
      width: "100%",
      backgroundColor: colors.secondary,
    },
    text: {
      color: colors.text,
    },
    color: {
      color: colors.background,
    },
    secondaryColor: {
      color: colors.secondary,
    },
    input: {
      backgroundColor: "white",
      height: 45,
      width: 250,
      margin: 10,
      borderWidth: 2,
      borderRadius: 10,
      padding: 10,
    },
    form: {
      justifyContent: "center",
    },
    header: {
      fontSize: 30,
      color: colors.text,
      marginBottom: 10,
    },
    backgroundColor: {
      backgroundColor: colors.background,
    },
    secondaryBackgroundColor: {
      backgroundColor: colors.secondary,
    },
    scrollView: {
      height: "100%",
      width: "100%",
    },
    content: {
      width: "100%",
      height: "100%",
      alignItems: "center",
    },
    topSection: {
      alignItems: "center",
      width: "100%",
    },
    iconRightSide: {
      color: colors.secondary,
      position: "absolute",
      right: 20,
    },
    border: {
      borderColor: colors.secondary,
    },
    container: {
      width: "100%",
      marginVertical: 10,
      alignItems: "center",
    },
    // Card style for horizontal layout (renderExercise)
    cardRow: {
      width: "90%",
      flexDirection: "row",
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      elevation: 4,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      padding: 15,
      borderColor: colors.cardBorder,
      borderWidth: 1,
    },
    // Card style for vertical layout (renderSessionItem and renderWorkoutPlanItem)
    cardColumn: {
      width: "90%",
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      elevation: 4,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      padding: 20,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      marginTop: 10,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 10,
    },
    infoContainer: {
      flex: 1,
      paddingLeft: 15,
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8, // Added marginBottom for consistency
    },
    details: {
      flexDirection: "row",
      marginTop: 8,
    },
    detailsText: {
      color: colors.text,
      opacity: 0.7,
      marginRight: 20,
      fontSize: 14,
    },
    dateText: {
      fontSize: 14,
      color: colors.text,
    },
    description: {
      fontSize: 15,
      color: colors.text,
      marginBottom: 15,
    },
    completedText: {
      color: colors.successText,
      fontWeight: "bold",
      marginTop: 8,
    },
    completedCard: {
      opacity: 0.9,
      backgroundColor: colors.completedBackground,
    },
    completedIcon: {
      position: "absolute",
      top: 10,
      right: 10,
      color: colors.successText,
    },
    completedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.completedOverlay,
      borderRadius: 12,
    },
    skippedCard: {
      backgroundColor: colors.skippedBackground,
      opacity: 0.7,
    },
    skippedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.skippedOverlay,
      borderRadius: 12,
    },
    skippedText: {
      color: "grey",
      fontWeight: "bold",
      marginTop: 8,
    },
    statusText: {
      fontWeight: "bold",
      alignSelf: "flex-end",
      fontSize: 14,
      color: colors.text,
    },
    pendingStatus: {
      color: colors.errorText,
    },
    completedStatus: {
      color: colors.successText,
    },
    skippedStatus: {
      color: "grey",
    },
    video: {
      width: "100%",
      height: 200,
      marginBottom: 16,
    },
    performanceContainer: {
      marginTop: 16,
    },
    commentInput: {
      height: 100,
      textAlignVertical: "top",
    },
    sliderContainer: {
      marginBottom: 20,
    },
    sliderLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 10,
    },
    loadingText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginTop: 20,
    },
    listContainer: {
      flex: 1,
    },
    specialistCard: {
      backgroundColor: colors.cardBackground,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3, // For Android shadow
      alignItems: "center",
    },
    specialistName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 5,
    },
    specialistBio: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 5,
    },
    specialistDistance: {
      fontSize: 14,
      color: colors.text,
    },
    datePickerContainer: {
      marginBottom: 20,
    },
    dateButton: {
      padding: 10,
      backgroundColor: "#1EB1FC",
      borderRadius: 5,
      alignItems: "center",
    },
    dateButtonText: {
      color: "#fff",
      fontSize: 16,
    },
    timeSlotsContainer: {
      marginBottom: 20,
    },
    timeSlotButton: {
      padding: 10,
      backgroundColor: "#f0f0f0",
      borderRadius: 5,
      marginRight: 10,
      alignItems: "center",
    },
    timeSlotText: {
      fontSize: 16,
      color: "#333",
    },
    selectedTimeSlotButton: {
      backgroundColor: "#1EB1FC",
    },
    selectedTimeSlotText: {
      color: "#fff",
    },
    noSlotsText: {
      fontSize: 16,
      color: "#999",
    },
    appointmentCard: {
      backgroundColor: colors.cardBackground,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3, // For Android shadow
    },
    appointmentSpecialist: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 5,
    },
    appointmentTime: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 5,
    },
    appointmentBio: {
      fontSize: 14,
      color: colors.text,
    },
    noAppointmentsText: {
      fontSize: 16,
      color: "#999",
      textAlign: "center",
      marginTop: 10,
    },
  });
};

export default ThemedStyle;
