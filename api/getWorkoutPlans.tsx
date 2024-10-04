import { WorkoutPlan } from "../app/client/Programs";
import { supabase } from "../supabase";

export default async function fetchWorkoutPlans(
  client_id: string
): Promise<WorkoutPlan[] | null> {
  const { data, error } = await supabase
    .from("workoutPlan_assignments")
    .select(
      `
          *,
          workout_plan:workout_plans!workoutPlan_assignments_plan_id_fkey  (
            *
          )
        `
    )
    .eq("client_id", client_id)
    .order("status", { ascending: true })
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("Error fetching workout plans:", error);
    return null;
  }

  if (data) {
    return data;
  } else {
    return null;
  }
}
