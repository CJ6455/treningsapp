import * as ImagePicker from "expo-image-picker";

const pickImage = async (): Promise<string | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error("Error picking image:", error);
    return null;
  }
};

export default pickImage;
