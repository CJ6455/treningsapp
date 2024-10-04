import { supabase } from "../supabase"; // Import your Supabase client

/**
 * Toggle the like status of a blog post.
 * @param postId - The ID of the blog post to like/unlike.
 * @param userId - The ID of the current user.
 * @returns A promise that resolves when the operation is complete.
 */
export const likeBlogPost = async (
  postId: string,
  userId: string
): Promise<void> => {
  try {
    // Fetch the current likes for the post
    console.log(postId, userId);
    const { data: likeData, error: fetchError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();
    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is the error code for no matching rows, so ignore it if that's the case
      throw fetchError;
    }
    console.log("likeData", likeData);

    if (likeData && likeData.id) {
      // User already liked the post, so we should unlike it
      console.log(
        "Current user has already liked this post, unliking it now..."
      );
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;
    } else {
      // User has not liked the post yet, so we should like it
      console.log("Current user has not liked this post yet, liking it now...");
      const { error: insertError } = await supabase.from("likes").insert([
        {
          post_id: postId,
          user_id: userId,
        },
      ]);
    }
  } catch (error) {
    console.error("Error toggling like status:", error);
    throw error;
  }
};
export default likeBlogPost;
