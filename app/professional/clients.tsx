import {
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Pressable,
  SafeAreaView,
  Text,
  View,
  Image,
} from "react-native";
import ThemedStyle from "../../styleSheet";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ClientPageStackParamList,
  MessagesStackParamList,
} from "../../navigation/navigationOptions";
import { useEffect, useState } from "react";
import { User } from "../common/Settings";
import { useAuth } from "../../services/AuthContext";
import { supabase } from "../../supabase";
import downloadImage from "../../api/imageStorage";
import { set } from "date-fns";

export interface Client {
  user_info: User;
  client_id: string;
}
const Clients = () => {
  const style = ThemedStyle();
  const nav =
    useNavigation<NativeStackNavigationProp<ClientPageStackParamList>>();

  const [clients, setClients] = useState<Client[]>([]);
  const { session, professionalData } = useAuth();

  useEffect(() => {
    if (!professionalData) return;

    const fetchUsers = async () => {
      if (!session || !professionalData) return;

      // Step 1: Get client IDs
      const { data, error } = await supabase
        .from("client_specialist")
        .select(
          `
      clients (
        id,
        profiles (*)
      )
    `
        )
        .eq("specialist_id", professionalData.id);

      if (error) {
        console.error("Error fetching clients:", error);
        return;
      }

      const clients = await Promise.all(
        data.map(async (clientData: any) => {
          const client = clientData.clients;
          const profile = client.profiles;
          const avatarUrl = await downloadImage("avatars", profile.avatar_url);

          return {
            user_info: {
              ...profile,
              avatar_url: avatarUrl,
            },
            client_id: client.id,
          };
        })
      );

      setClients(clients);
    };
    fetchUsers();
  }, [professionalData]);

  const renderItem: ListRenderItem<Client> = ({ item }) => {
    return (
      <Pressable
        style={{ marginVertical: 10 }}
        onPress={() => nav.navigate("ClientPage", { client: item })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: item.user_info.avatar_url }}
            style={{
              width: 40,

              aspectRatio: 1,
              margin: 5,
              borderRadius: 20,
            }}
          />
          <Text style={[style.text, { marginLeft: 10 }]}>
            {item.user_info.full_name}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={style.main}>
      <KeyboardAvoidingView>
        <FlatList
          data={clients}
          keyExtractor={(item) => item.client_id}
          renderItem={renderItem}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default Clients;
