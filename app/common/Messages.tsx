import {
  FlatList,
  Text,
  View,
  Image,
  Pressable,
  KeyboardAvoidingView,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemedStyle from "../../styleSheet";
import { useEffect, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { supabase } from "../../supabase";
import downloadImage from "../../api/imageStorage";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../../services/AuthContext";
import { MessagesStackParamList } from "../../navigation/navigationOptions";
import { User } from "./Settings";

const Messages = () => {
  const style = ThemedStyle();
  const nav =
    useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const [users, setUsers] = useState<User[]>([]);
  const { session } = useAuth();
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session) return;
      const { data, error } = await supabase
        .from("profiles")
        .select()
        .neq("id", session.user.id);
      if (data) {
        for (const user of data) {
          user.avatar_url = await downloadImage("avatars", user.avatar_url);
        }
        setUsers(data);
      }
    };
    fetchUsers();
  }, [session]);

  const renderItem: ListRenderItem<User> = ({ item }) => {
    return (
      <Pressable
        style={{ marginVertical: 10 }}
        onPress={() => nav.navigate("Chat", { user: item })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: item.avatar_url }}
            style={{
              width: 40,

              aspectRatio: 1,
              margin: 5,
              borderRadius: 20,
            }}
          />
          <Text style={[style.text, { marginLeft: 10 }]}>{item.full_name}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={style.main}>
      <KeyboardAvoidingView>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Messages;
