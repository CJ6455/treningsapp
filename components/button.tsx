import { StyleSheet, View, Pressable, Text } from "react-native";
import React, { FC } from "react";

interface ButtonClass {
  label: string;
  onPress: () => void;
}

export const Button: FC<ButtonClass> = ({ label, onPress }) => {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.button,
            pressed ? { backgroundColor: "#0d9184" } : null,
          ]}
        >
          <Text style={styles.buttonLabel}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 150,
    height: 45,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17C3B2",
    margin: 10,
  },
  buttonLabel: {
    fontSize: 16,
  },
});
