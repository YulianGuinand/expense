import { colors, radius, spacingY } from "@/constants/theme";
import { StatsBarChartProps } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { Dimensions, StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

const NO_OF_SECTIONS = 4;
const LOWLIGHT_OPACITY = 0.35;

function monthLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
  });
}

export function StatsBarChart({
  data,
  type,
  selectedIndex,
  onSelect,
}: StatsBarChartProps) {
  const accent = type === "income" ? colors.green : colors.rose;
  const values = data.map((stat) =>
    type === "income" ? stat.income : stat.expenses,
  );
  const stepValue = Math.max(
    1,
    Math.ceil(Math.max(...values, 0) / NO_OF_SECTIONS),
  );

  const barData = data.map((stat, index) => ({
    value: values[index],
    label: monthLabel(stat.period),
    frontColor: accent,
    onPress: () => onSelect(index),
  }));

  const chartWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <BarChart
        data={barData}
        barWidth={scale(10)}
        spacing={scale(24)}
        roundedTop
        barBorderRadius={radius._6}
        noOfSections={NO_OF_SECTIONS}
        stepValue={stepValue}
        maxValue={stepValue * NO_OF_SECTIONS}
        height={verticalScale(160)}
        width={chartWidth}
        hideAxesAndRules
        xAxisLabelTextStyle={styles.axisText}
        highlightEnabled
        highlightedBarIndex={selectedIndex ?? -1}
        lowlightOpacity={LOWLIGHT_OPACITY}
        onBackgroundPress={() => onSelect(-1)}
        hideOrigin
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._5,
    backgroundColor: colors.neutral800,
    borderRadius: radius._10
  },
  axisText: {
    color: colors.neutral400,
    fontSize: verticalScale(11),
  },
});