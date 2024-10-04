import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, Session } from "@supabase/supabase-js";
import { Observable, observable } from '@legendapp/state'
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { configureSynced } from '@legendapp/state/sync'
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage'
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
const supabaseUrl = "https://xildvzzknywwlhbztzlh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGR2enprbnl3d2xoYnp0emxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDIzNTgsImV4cCI6MjA0MTE3ODM1OH0.VH5S-qicKElXxp5NtyOjwXDSLiiZOTSfuBY3A76G6L8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});


// // Configure synchronization
// const customSynced = configureSynced(syncedSupabase, {
//   persist: {
//     plugin: observablePersistAsyncStorage({ AsyncStorage }),
//   },
//   supabase,
//   changesSince: 'last-sync',
//   fieldCreatedAt: 'created_at',
//   fieldUpdatedAt: 'updated_at',
//   fieldDeleted: 'deleted', // Optional for soft deletes
// });

// let userExercises$:Observable;
// let userExerciseSets$;

// export const initializeObservables = (userId: string) => {
//   // Initialize userExercises$
//   userExercises$ = observable(
//     customSynced({
//       supabase,
//       collection: 'user_exercises',
//       select: (from) =>
//         from
//           .select(
//             `
//             *,
//             user_session:user_sessions (
//               *,
//               workoutplan_assignment:workoutPlan_assignments (
//                 *,
//                 client:clients (
//                   user_id
//                 )
//               )
//             ),
//             exercise_info:exercises (*)
//             `
//           )
//           .eq('user_session.workoutplan_assignment.client.user_id', userId),
//       actions: ['read', 'create', 'update', 'delete'],
//       realtime: true,
//       persist: {
//         name: `user_exercises_${userId}`, // Unique per user
//         retrySync: true,
//       },
//       retry: {
//         infinite: true,
//       },
//     })
//   );

//   // Initialize userExerciseSets$
//   userExerciseSets$ = observable(
//     customSynced({
//       supabase,
//       collection: 'user_exercise_set',
//       select: (from) =>
//         from
//           .select(
//             `
//             *,
//             user_exercise:user_exercises (
//               *,
//               user_session:user_sessions (
//                 *,
//                 workoutplan_assignment:workoutPlan_assignments (
//                   *,
//                   client:clients (
//                     user_id
//                   )
//                 )
//               )
//             )
//             `
//           )
//           .eq('user_exercise.user_session.workoutplan_assignment.client.user_id', userId),
//       actions: ['read', 'create', 'update', 'delete'],
//       realtime: true,
//       persist: {
//         name: `user_exercise_set_${userId}`, // Unique per user
//         retrySync: true,
//       },
//       retry: {
//         infinite: true,
//       },
//     })
//   );
// };

//export { userExercises$, userExerciseSets$ };

