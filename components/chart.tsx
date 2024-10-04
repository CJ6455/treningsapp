import { LineChart } from "react-native-chart-kit";
import { LineChartData } from "react-native-chart-kit/dist/line-chart/LineChart";
import { StyleSheet, View, useColorScheme } from "react-native";

interface chartProps {
  data: LineChartData;
}

export default function Chart({ data }: chartProps) {
  const colorScheme = useColorScheme();
  return (
    <LineChart
      data={data}
      width={350}
      height={300}
      chartConfig={colorScheme === "dark" ? chartConfigDark : chartConfigLight}
      style={styles.chart}
    />
  );
}

const styles = StyleSheet.create({
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
const chartConfigLight = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0,
  fillShadowGradientFromOpacity: 0,
  fillShadowGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(37, 41, 46, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false, // optional
};
const chartConfigDark = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0,
  fillShadowGradientFromOpacity: 0,
  fillShadowGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(239, 255, 250, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false, // optional
};
