// mark_sessions_status.ts


import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const url = new URL(_req.url);
  const userId = url.searchParams.get('userId');
  try {
   
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    // Get today's date in YYYY-MM-DD format
    if(!supabase) {
      throw new Error('Supabase client could not be initialized.');
    }
    const today = new Date().toISOString().split('T')[0];
    // Fetch sessions that are past their planned date and not completed, skipped, or partial
    const { data: sessions, error: fetchSessionsError } = await supabase
    .from('user_sessions')
    .select(`
      id,
      assignment_id,
      planned_date,
      status,
      workoutPlan_assignments!inner(client_id)
    `)
    .eq('workoutPlan_assignments.client_id', userId)  // Ensure client_id matches userId
    .lt('planned_date', today)  // Sessions that are past the planned date
    .in('status', ['notCompleted']); 

    if (fetchSessionsError) {
      console.error('Error fetching sessions:', fetchSessionsError);
      throw fetchSessionsError;
      
    }
    

    if (!sessions || sessions.length === 0) {
      console.log('No sessions to update.');
      return new Response('No sessions to update.', { status: 200 });
    }

    // For each session, process the exercises and update the session status
    for (const session of sessions) {
      const sessionId = session.id;

      // Fetch exercises for the session
      const { data: exercises, error: fetchExercisesError } = await supabase
        .from('user_exercises')
        .select('id, status')
        .eq('session_id', sessionId);

      if (fetchExercisesError) {
        console.error(`Error fetching exercises for session ${sessionId}:`, fetchExercisesError);
        continue; // Skip to the next session
      }

      if (!exercises || exercises.length === 0) {
        console.log(`No exercises found for session ${sessionId}.`);
        continue; // Skip to the next session
      }

      // Identify exercises that are not 'Completed' or 'Skipped' (i.e., 'Incomplete' or 'Not Started')
      const incompleteExerciseIds = exercises
        .filter((exercise) => exercise.status !== 'Completed' && exercise.status !== 'Skipped')
        .map((exercise) => exercise.id);

      // If there are incomplete exercises, mark them as 'Skipped'
      if (incompleteExerciseIds.length > 0) {
        const { error: updateExercisesError } = await supabase
          .from('user_exercises')
          .update({ status: 'Skipped' })
          .in('id', incompleteExerciseIds);

        if (updateExercisesError) {
          console.error(`Error updating exercises for session ${sessionId}:`, updateExercisesError);
          continue; // Skip to the next session
        }

        console.log(`Updated ${incompleteExerciseIds.length} exercises to 'Skipped' for session ${sessionId}.`);
      }

      // After updating, fetch the updated exercises to determine the session status
      const { data: updatedExercises, error: fetchUpdatedExercisesError } = await supabase
        .from('user_exercises')
        .select('status')
        .eq('session_id', sessionId);

      if (fetchUpdatedExercisesError) {
        console.error(`Error fetching updated exercises for session ${sessionId}:`, fetchUpdatedExercisesError);
        continue; // Skip to the next session
      }

      // Determine the session status based on the exercises
      const allCompleted = updatedExercises.every((exercise) => exercise.status === 'Completed');
      const allSkipped = updatedExercises.every((exercise) => exercise.status === 'Skipped');

      let sessionStatus = 'Partial';

      if (allCompleted) {
        sessionStatus = 'Completed';
      } else if (allSkipped) {
        sessionStatus = 'Skipped';
      } else {
        // Mix of 'Completed' and 'Skipped'
        sessionStatus = 'Partial';
      }

      // Update the session status
      const { error: updateSessionError } = await supabase
        .from('user_sessions')
        .update({ status: sessionStatus })
        .eq('id', sessionId);

      if (updateSessionError) {
        console.error(`Error updating session ${sessionId} status:`, updateSessionError);
        continue; // Skip to the next session
      }

      console.log(`Session ${sessionId} status updated to '${sessionStatus}'.`);
    }

    return new Response('Sessions updated successfully.', { status: 200 });
    
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})


 
 

