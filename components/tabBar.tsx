import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import ThemedStyle from "../styleSheet";
import { useState } from "react";

interface tabBarProps {
  onSelectedTab: (tab: string) => void;
}

export default function TabBar({ onSelectedTab }: tabBarProps) {
  const colorStyle = ThemedStyle();
  const colorScheme = useColorScheme();
  const [selectedTab, setSelectedTab] = useState("Sum");

  const tabs = ["Sum", "Søvn", "Stress", "Smerte"];
  return (
    <View style={style.menuBar}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab}
          onPress={() => {
            setSelectedTab(tab);
            onSelectedTab(tab);
          }}
          style={[
            style.menuItemContainer,
            {
              borderRightColor: colorScheme === "dark" ? "#effffa" : "#25292e",
            },
            tab === "Smerte" ? { borderRightWidth: 0 } : null,
          ]}
        >
          <Text
            style={[
              style.menuItem,
              selectedTab === tab
                ? { color: "#17C3B2" }
                : colorStyle.secondaryColor,
            ]}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const style = StyleSheet.create({
  menuBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: 400,
    height: 70,
    padding: 15,
  },
  menuItemContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  menuItem: {
    fontSize: 16,
    fontWeight: "bold",
  },
  separator: {
    width: 1,
    opacity: 0.3,
    marginVertical: 15,
  },
});
