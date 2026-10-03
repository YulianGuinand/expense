import { Typo } from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { GoalCardProps } from "@/types";
import { verticalScale } from "@/utils/styling";
import { StyleSheet, View } from "react-native";

function percent(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / goal) * 100)));
}

export function GoalCard({
  goal,
  amount,
  totalIncome,
  totalExpenses,
}: GoalCardProps) {
  const progress = percent(amount, goal);
  const incomePercent = percent(totalIncome, goal);
  const expensesPercent = percent(totalExpenses, goal);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Typo size={12} color={colors.neutral400}>
            Objectif global ({goal.toFixed(0)}€)
          </Typo>
          <Typo size={20} fontWeight={"700"} style={styles.completedText}>
            Complété {progress}%
          </Typo>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statColumn}>
          <View style={styles.miniTrack}>
            <View style={[styles.miniFillIncome, { width: `${incomePercent}%` }]} />
          </View>
          <Typo size={12} color={colors.neutral400}>
            Revenu {incomePercent}%
          </Typo>
        </View>

        <View style={styles.statColumn}>
          <View style={styles.miniTrack}>
            <View style={[styles.miniFillExpense, { width: `${expensesPercent}%` }]} />
          </View>
          <Typo size={12} color={colors.neutral400}>
            Dépense {expensesPercent}%
          </Typo>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._17,
    padding: spacingX._20,
    gap: spacingY._15,
    borderCurve: "continuous",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    gap: verticalScale(2),
  },
  completedText: {
    letterSpacing: 0.3,
  },
  iconButton: {
    width: verticalScale(36),
    height: verticalScale(36),
    borderRadius: radius._12,
    backgroundColor: colors.neutral800,
    justifyContent: "center",
    alignItems: "center",
  },
  track: {
    height: verticalScale(8),
    borderRadius: radius._10,
    backgroundColor: colors.neutral700,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius._10,
    backgroundColor: colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacingX._20,
    marginTop: spacingY._5,
  },
  statColumn: {
    flex: 1,
    gap: spacingY._7,
  },
  miniTrack: {
    height: verticalScale(5),
    borderRadius: radius._10,
    backgroundColor: colors.neutral700,
    overflow: "hidden",
  },
  miniFillIncome: {
    height: "100%",
    borderRadius: radius._10,
    backgroundColor: colors.green,
  },
  miniFillExpense: {
    height: "100%",
    borderRadius: radius._10,
    backgroundColor: colors.rose,
  },
});