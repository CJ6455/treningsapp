// Home.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Platform, Alert } from "react-native";
import { ThemedStyle } from "../../styleSheet";
import BlogSection from "../../components/blogSection";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { IconButton } from "../../components/iconButton";
import TabBar from "../../components/tabBar";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../supabase";
import { Session } from "@supabase/supabase-js";
import downloadImage from "../../api/imageStorage";
import { useAuth } from "../../services/AuthContext";
import { HomeStackParamList } from "../../navigation/navigationOptions";

const Home = () => {
  const style = ThemedStyle();
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [loading, setLoading] = useState(true); // Initial loading state
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState("Sum");
  const { session } = useAuth();

  const fetchBlogPosts = async () => {
    try {
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("blogposts_with_author_and_likes")
        .select();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        const formattedPosts = await Promise.all(
          data.map(async (post: any) => {
            const imageUrl = post.image_url
              ? await downloadImage("blogImages", post.image_url)
              : null;
            const author_avatar_url = post.author.author_avatar
              ? await downloadImage("avatars", post.author.author_avatar)
              : null;

            return {
              id: post.id,
              activity: post.activity,
              caption: post.caption,
              author_id: post.author.author_avatar,
              authorPic: author_avatar_url,
              authorName: post.author.author_username,
              image_url: imageUrl,
              like_count: post.like_count,
              createdAt: new Date(post.created_at),
            };
          })
        );

        setBlogPosts(formattedPosts);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlogPosts();
  };

  useEffect(() => {
    if (session) {
      fetchBlogPosts();
    }
  }, [session]);

  return (
    <SafeAreaView style={style.main}>
      <View style={style.topSection}>
        {Platform.OS !== "web" && (
          <>
            <Text style={[style.header, style.secondaryColor]}>Hjem</Text>
            <View style={style.iconRightSide}>
              <IconButton
                name="plus-square"
                size={24}
                onPress={() => nav.navigate("CreateBlogPost")}
              />
            </View>
          </>
        )}
      </View>
      <View style={style.content}>
        {/* <Chart data={tabData[selectedTab] || chartExampleDataSum} /> */}
        <BlogSection
          blogPosts={blogPosts}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      </View>
    </SafeAreaView>
  );
};

export default Home;
