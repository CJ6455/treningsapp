import React, { useEffect, useState, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import ThemedStyle from "../../../styleSheet";

import { IconButton } from "../../../components/iconButton";

// Ensure you have access to the Firestore db
import { supabase } from "../../../supabase";

import { useAuth } from "../../../services/AuthContext";
import { User } from "../Settings";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: Date;
}
const Chat = () => {
  const style = ThemedStyle();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = route.params as { user: User };
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { session } = useAuth();
  // Fetch and listen to messages
  const [chatId, setChatId] = useState<string | null>(null);
  const fetchChatId = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.rpc("find_chat_by_users", {
        user_id_1: session.user.id,
        user_id_2: user.id,
      });

      if (error) throw error;
      if (data) {
        setChatId(data);
      } else {
        const { data: chatData, error: chatError } = await supabase
          .from("chats")
          .insert({})
          .select()
          .single();
        if (chatError) throw chatError;
        setChatId(chatData.id);
        console.log("Chat created successfully with ID:", chatData.id);

        const { error: membersError } = await supabase
          .from("chat_members")
          .insert([
            { chat_id: chatData.id, user_id: session.user.id },
            { chat_id: chatData.id, user_id: user.id },
          ]);

        if (membersError) {
          throw membersError;
        }
      }
    } catch (error) {
      console.error("Error fetching chatID:", error);
    }
  };
  const fetchMessages = async () => {
    setMessages([]);
    const { data, error } = await supabase
      .from("messages")
      .select()
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;
    for (const msg of data) {
      setMessages((prev) => [...prev, msg]);
    }
  };
  const updateMessages = (payload: any) => {
    if (payload.new) {
      setMessages((prev) => [...prev, payload.new]);
    }
  };
  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`messages:chat_id=eq.${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        updateMessages
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [chatId]);
  useEffect(() => {
    if (session && user) fetchChatId();
  }, [session, user]);
  useEffect(() => {
    if (chatId) fetchMessages();
  }, [chatId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSendMessage = async () => {
    if (message.trim()) {
      try {
        const { error } = await supabase.from("messages").insert({
          chat_id: chatId,
          sender_id: session?.user.id,
          content: message,
        });

        if (error) throw error;
      } catch (error) {
        //delete the message from the list if there is an error
        setMessages((prev) => prev.filter((msg) => msg.content !== message));
        console.error("Error sending message:", error);
      } finally {
        setMessage("");
      }
    }
  };

  return (
    <SafeAreaView style={style.main}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%", alignItems: "center" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <Text style={style.header}>{user.full_name}</Text>

        <ScrollView
          ref={scrollViewRef}
          style={{ width: "100%" }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          contentContainerStyle={{
            padding: 10,
            paddingBottom: 10,
            flexGrow: 1,
            alignItems: "center",
          }}
        >
          <View style={{ width: "70%" }}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={{
                  marginBottom: 10,
                  alignSelf:
                    msg.sender_id === session?.user.id
                      ? "flex-end"
                      : "flex-start",
                  backgroundColor:
                    msg.sender_id === session?.user.id ? "#DCF8C6" : "#FFFFFF",
                  padding: 10,
                  borderRadius: 10,
                  maxWidth: "80%",
                }}
              >
                <Text>{msg.content}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", padding: 10 }}>
          <TextInput
            style={[style.input, { flex: 1, marginRight: 10 }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
          />
          <IconButton name="send" size={24} onPress={handleSendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
