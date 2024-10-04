import { StyleSheet, Pressable } from "react-native";
import React, { FC } from "react";
import Feather from "@expo/vector-icons/Feather";

import ThemedStyle from "../styleSheet";
type FeatherIconName = keyof typeof Feather.glyphMap;

interface IconButtonClass {
  name: FeatherIconName;
  size: number;
  onPress: () => void;
  isLiked?: boolean;
}

export const IconButton: FC<IconButtonClass> = ({
  name,
  size,
  onPress,
  isLiked = false,
}) => {
  const style = ThemedStyle();
  return (
    <Pressable style={layout.pressable} onPress={onPress}>
      {({ pressed }) => (
        <Feather
          name={name}
          size={size}
          style={
            isLiked
              ? layout.likedColor
              : pressed
              ? layout.likedColor
              : style.secondaryColor
          }
        />
      )}
    </Pressable>
  );
};

const layout = StyleSheet.create({
  pressable: {
    padding: 10,
  },
  likedColor: {
    color: "#17C3B2",
  },
});
