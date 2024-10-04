// LikeModal.tsx
import { useRoute } from "@react-navigation/native";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ThemedStyle from "../../../styleSheet";
import { supabase } from "../../../supabase";
// Adjust the import path accordingly
import { Image } from "expo-image";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
}
const LikeModal = () => {
  const route = useRoute();
  const { post_id } = route.params as { post_id: string };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const styles = ThemedStyle();

  // Function to get public image URLs
  async function getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 60
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error generating signed URL: ", error.message);
      }
      return null;
    }
  }

  const fetchUsers = useCallback(async () => {
    try {
      if (refreshing) {
        setLoading(true);
      }

      // Fetch likes along with user profiles in a single query
      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select(
          `
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("post_id", post_id);

      if (likesError) {
        throw likesError;
      }

      if (!likes || likes.length === 0) {
        setUsers([]); // No likes
        return;
      }

      // Extract user profiles from likes
      const profiles: User[] = likes
        .map((like: any) => like.user)
        .filter((user: User | null) => user !== null);

      // Remove duplicate profiles (if any)
      const uniqueProfilesMap: Record<string, User> = {};
      profiles.forEach((profile) => {
        if (profile && !uniqueProfilesMap[profile.id]) {
          uniqueProfilesMap[profile.id] = profile;
        }
      });

      const uniqueProfiles = Object.values(uniqueProfilesMap);

      // Asynchronously generate full URLs for avatar images
      const usersWithAvatars: User[] = await Promise.all(
        uniqueProfiles.map(async (profile) => {
          let fullAvatarUrl: string | null = null;

          if (profile.avatar_url) {
            // Generate signed URL
            fullAvatarUrl = await getSignedUrl("avatars", profile.avatar_url);
          }

          return {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: fullAvatarUrl,
          };
        })
      );

      setUsers(usersWithAvatars);
    } catch (err: any) {
      console.error("Error fetching users who liked the post:", err);
      setError(err.message || "An error occurred while fetching likes.");
      Alert.alert(
        "Error",
        err.message || "An error occurred while fetching likes."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [post_id, refreshing]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  // Render individual user item
  const renderItem = useCallback(
    ({ item }: { item: User }) => <UserItem user={item} />,
    []
  );

  const keyExtractor = useCallback((item: User) => item.id, []);

  return (
    <SafeAreaView style={styles.main}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            !loading && (
              <Text>
                {error ? "Feil ved lasting av likes." : "Ingen likes enda."}
              </Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

// Separate component for rendering each user
const UserItem: React.FC<{ user: User }> = React.memo(({ user }) => {
  return (
    <View style={styles.itemContainer}>
      {user.avatar_url ? (
        <Image
          style={styles.avatar}
          source={{
            uri: user.avatar_url,
          }}
          contentFit="cover"
          // Optional placeholder
          transition={500}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>
            {user.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.username}>{user.full_name}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  username: {
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 16,
  },
});

export default LikeModal;
