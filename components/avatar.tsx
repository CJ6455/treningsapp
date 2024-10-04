// Avatar.tsx
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Button } from "@rneui/themed";
import { supabase } from "../supabase";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../services/AuthContext";

interface Props {
  size?: number; // Optional with a default value
  url: string | null;
  onUpload: (filePath: string) => void;
}

const Avatar: React.FC<Props> = ({ url, size = 150, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarSize = { height: size, width: size };
  const { session } = useAuth();
  useEffect(() => {
    if (url) {
      downloadImage(url);
    }
  }, [url]);

  const downloadImage = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .download(path);

      if (error) {
        throw error;
      }

      const reader = new FileReader();
      reader.readAsDataURL(data);
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error downloading image:", error.message);
      }
    }
  };

  const uploadAvatar = async () => {
    if (!session) return;
    try {
      setUploading(true);

      // Launch Image Picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("User cancelled image picker.");
        return;
      }

      const image = result.assets[0];

      if (!image.uri) {
        throw new Error("No image URI found.");
      }

      // Resize the Image with adaptive compression to keep under 50 KB
      let compressQuality = 0.5;
      let compressedImage = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: 500 } }],
        { compress: compressQuality, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Iterate to reduce file size below 50 KB
      let fileInfo = await FileSystem.getInfoAsync(compressedImage.uri);

      while (
        fileInfo.exists &&
        (fileInfo.size || Infinity) > 50 * 1024 &&
        compressQuality > 0.1
      ) {
        compressQuality -= 0.1;

        compressedImage = await ImageManipulator.manipulateAsync(
          image.uri,
          [],
          {
            compress: compressQuality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        fileInfo = await FileSystem.getInfoAsync(compressedImage.uri);
      }

      // Read the compressed image as base64
      const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary buffer
      const binary = Buffer.from(base64, "base64");
      if (binary.length > 50 * 1024) {
        console.log("File size:", binary.length / 1024, "KB");
        Alert.alert("Error", "Bildet er for stort.");
        return;
      }

      if (binary.length === 0) {
        throw new Error("Binary data is empty.");
      }

      // Determine Content-Type
      const fileExt =
        compressedImage.uri.split(".").pop()?.toLowerCase() || "jpeg";
      const contentType = fileExt === "png" ? "image/png" : "image/jpeg";

      // Generate a Unique Filename
      const filename = `${session.user.id}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filename, binary, {
          contentType: contentType,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      Alert.alert("Success", "Avatar uploaded successfully!");
      onUpload(data.path);

      // Update the avatarUrl state to display the new avatar immediately
      downloadImage(data.path);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Upload Error", error.message);
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("Upload Error", "An unexpected error occurred.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          accessibilityLabel="Avatar"
          style={[avatarSize, styles.avatar, styles.image]}
        />
      ) : (
        <View style={[avatarSize, styles.avatar, styles.noImage]}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      )}
      <Button
        title={uploading ? "Uploading..." : "Upload"}
        onPress={uploadAvatar}
        disabled={uploading}
        containerStyle={styles.buttonContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatar: {
    borderRadius: 75,
    overflow: "hidden",
    backgroundColor: "#e1e1e1",
  },
  image: {
    resizeMode: "cover",
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    marginTop: 10,
    width: 100,
  },
});

export default Avatar;
