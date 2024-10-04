import { Platform, ColorSchemeName } from 'react-native';
import { trainingSession } from '../app/client/modals/workoutPlan';
import { Exercise } from '../app/client/modals/trainingSession';
import { WorkoutPlan } from '../app/client/Programs';
import { User } from '../app/common/Settings';
import { Client } from '../app/professional/clients';


export const getStackScreenOptions = (colorScheme: ColorSchemeName) => {
  return Platform.OS === "web"
    ? {
        headerShown: true,
        headerStyle: colorScheme === "dark"
          ? { backgroundColor: "#25292e" }
          : { backgroundColor: "#effffa" },
        headerTintColor: colorScheme === "dark" ? "#effffa" : "#25292e",
      }
    : { headerShown: false };
};


export type RootStackParamList = {
    CliTab: undefined;
    ProTab: undefined;
    Auth: undefined;
  };

  export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
  };
  
  export type HomeStackParamList = {
    Home: undefined;
    CreateBlogPost: undefined;
    LikedBy:{post_id: string};
  };
  
  export type MessagesStackParamList = {
    Messages: undefined;
    Chat: { user: User };
  };
  
  export type ActivitiesStackParamList = {
    Activities: undefined;
    // Define other modal screens if needed
  };
  
  export type AppointmentsStackParamList = {
    Appointments: undefined;
    CreateAppointment: undefined;
  };
  
  export type ProgramsStackParamList = {
    Programs: undefined;
    WorkoutPlan: {program: WorkoutPlan};
    TrainingSession: {training_session: trainingSession};
    ExerciseDetail: { exercises:Exercise[],currentIndex:number};
    PublishSession: { session: trainingSession };
  };
  
  export type SettingsStackParamList = {
    Settings: undefined;
    EditAccount: undefined;
  };
  
  // Combine all stack params if needed
  export type ClientTabParamList = {
    Hjem: undefined;
    Aktiviteter: undefined;
    Meldinger: undefined;
    Avtaler: undefined;
    Programmer: undefined;
    Instillinger: undefined;
    // Add more if necessary
  };

  export type ClientPageStackParamList = {
    Clients: undefined;
    ClientPage: { client: Client };
  }

  export type ProfessionalTabParamList = {
    Hjem: undefined;
    Klienter: undefined;
    Meldinger: undefined;
    Avtaler: undefined;
    Instillinger: undefined;
  };
  