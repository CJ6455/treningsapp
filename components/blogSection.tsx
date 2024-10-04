// BlogSection.tsx
import React, { FC, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Pressable,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import ThemedStyle from "../styleSheet"; // Adjust the import path as needed
import { supabase } from "../supabase";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { formatDate } from "../services/dateFormatter";
import TabBar from "./tabBar";
import { useAuth } from "../services/AuthContext";
import { HomeStackParamList } from "../navigation/navigationOptions";
import { color } from "@rneui/themed/dist/config";

interface BlogSectionProps {
  blogPosts: BlogPost[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

interface BlogPost {
  id: string;
  activity: string;
  caption: string;
  author_id: string;
  image_url: string;
  authorName: string;
  authorPic: string;
  createdAt: string;
  like_count: number;
  isLiked?: boolean;
}

const BlogSection: FC<BlogSectionProps> = ({
  blogPosts,
  loading,
  refreshing,
  onRefresh,
  selectedTab,
  setSelectedTab,
}) => {
  const colorStyle = ThemedStyle();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { session } = useAuth();
  const [updatingLikes, setUpdatingLikes] = useState<Record<string, boolean>>(
    {}
  );
  const [postLikes, setPostLikes] = useState<
    Record<string, { likes: number; liked: boolean }>
  >({});

  useEffect(() => {
    const initializeLikes = async () => {
      if (!session?.user || blogPosts.length === 0) return;

      const initialState: Record<string, { likes: number; liked: boolean }> =
        {};

      await Promise.all(
        blogPosts.map(async (post) => {
          const likedByUser = await isLiked(post.id);
          initialState[post.id] = {
            likes: post.like_count || 0,
            liked: likedByUser || false,
          };
        })
      );

      setPostLikes(initialState);
    };

    initializeLikes();
  }, [session, blogPosts]);

  const isLiked = async (postId: string): Promise<boolean> => {
    if (!session?.user) return false;

    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error checking like status:", error.code);
      return false;
    }

    return Boolean(data.length > 0);
  };

  const likeHandler = async (postId: string) => {
    if (!session) return;
    if (!session.user) {
      Alert.alert("Vennligst logg inn for å like innlegg");
      return;
    }
    if (updatingLikes[postId]) return;

    const isLikedByCurrentUser = postLikes[postId]?.liked;
    const change = isLikedByCurrentUser ? -1 : 1;

    setUpdatingLikes((prevState) => ({
      ...prevState,
      [postId]: true,
    }));

    // Optimistically update the UI
    setPostLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: {
        likes: prevLikes[postId].likes + change,
        liked: !isLikedByCurrentUser,
      },
    }));

    try {
      if (isLikedByCurrentUser) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", session.user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({
          post_id: postId,
          user_id: session.user.id,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling like status:", error);
      Alert.alert("Noe gikk galt ved endring av like-status");

      // Revert optimistic update if there's an error
      setPostLikes((prevLikes) => ({
        ...prevLikes,
        [postId]: {
          likes: prevLikes[postId].likes - change,
          liked: isLikedByCurrentUser,
        },
      }));
    } finally {
      setUpdatingLikes((prevState) => ({
        ...prevState,
        [postId]: false,
      }));
    }
  };

  const renderBlogPost = ({ item }: { item: BlogPost }) => {
    // Parse the creation date
    const formattedDate = formatDate(item.createdAt);

    return (
      <View
        style={[
          styles.postContainer,
          colorStyle.border,
          colorStyle.appointmentCard,
        ]}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Activity Icon Positioned Above */}
          <View style={styles.activityIcon}>
            <MaterialCommunityIcons
              name={
                item.activity as keyof typeof MaterialCommunityIcons.glyphMap
              }
              size={24}
              style={colorStyle.secondaryColor}
            />
          </View>

          {/* Author Information */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",

              width: "100%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: item.authorPic }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <Text style={[styles.authorName, colorStyle.text]}>
                {item.authorName}
              </Text>
            </View>

            {/* Date */}
            <View style={{ padding: 10 }}>
              <Text style={[styles.dateText, colorStyle.text]}>
                {formattedDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Text style={[styles.captionText, colorStyle.text]}>
            {item.caption}
          </Text>
        </View>

        {/* Image */}
        {item.image_url ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.blogImage}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* Like Section */}
        <View style={styles.likeSection}>
          <Pressable onPress={() => likeHandler(item.id)}>
            <MaterialCommunityIcons
              name={postLikes[item.id]?.liked ? "heart" : "heart-outline"}
              size={24}
              color={postLikes[item.id]?.liked ? "red" : "grey"}
            />
          </Pressable>
          <Pressable
            style={styles.likeCount}
            onPress={() => navigation.navigate("LikedBy", { post_id: item.id })}
          >
            <Text style={[styles.likeText, colorStyle.text]}>
              {postLikes[item.id]?.likes || 0}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.blogSection}>
      {loading && blogPosts.length === 0 && (
        <ActivityIndicator
          size="large"
          color="#1EB1FC"
          style={{ marginTop: 20 }}
        />
      )}
      {!loading && blogPosts.length === 0 ? (
        <Text style={styles.noPostsText}>Ingen blogginnlegg funnet.</Text>
      ) : (
        <FlatList
          data={blogPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderBlogPost}
          style={styles.flatList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              <Text style={[{ alignSelf: "center" }, colorStyle.text]}>
                Din utvikling siste 7 dager
              </Text>
              <TabBar onSelectedTab={(tab) => setSelectedTab(tab)} />
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  blogSection: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    padding: 10,
  },
  flatList: {
    width: "100%", // Ensure FlatList does not exceed container width
  },
  listHeader: {
    width: "100%", // Ensure header components do not exceed screen width
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    alignSelf: "center", // Ensure header text is centered
  },
  contentContainer: {
    paddingBottom: 20,
    flexGrow: 1, // Ensure content grows correctly
  },
  noPostsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  likeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  likeCount: {
    marginLeft: 8,
  },
  postContainer: {
    width: "100%", // Ensures each post fits within the container
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSection: {
    flexDirection: "column", // Changed from "row" to "column"
    alignItems: "center", // Center items horizontally
    justifyContent: "flex-start", // Space between elements
    width: "100%", // Ensure it spans the full width
    marginBottom: 10, // Space below the header
  },
  activityIcon: {
    marginBottom: 5, // Space between icon and author info
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    // Ensure author info takes full width
    paddingHorizontal: 20, // Padding to align with other elements
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  authorName: {
    flexShrink: 1, // Allow text to wrap or truncate
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  dateText: {
    fontSize: 12,
    color: "#666",
    alignSelf: "center",
  },
  captionContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  captionText: {
    fontSize: 14,
    color: "#444",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  blogImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  likeText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 5,
  },
  loadingContainer: {
    width: "100%",
    alignItems: "center", // Centers horizontally
    justifyContent: "center", // Centers vertically
    marginTop: 20,
  },
});
export default BlogSection;
