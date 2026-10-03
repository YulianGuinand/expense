import { GoalCard } from "@/components/GoalCard";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StatsBarChart } from "@/components/StatsBarChart";
import { Typo } from "@/components/Typo";
import { dropdownStyles } from "@/constants/dropdownStyles";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { extractApiErrorMessage } from "@/services/api/apiClient";
import { transactionService } from "@/services/api/transactionService";
import { walletService } from "@/services/api/walletService";
import { queryKeys } from "@/services/query/queryKeys";
import { StatsTab } from "@/types";
import { verticalScale } from "@/utils/styling";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

const MONTHS_RANGE = 6;

function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function shortMonthLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
  });
}

export default function Statistics() {
  const [tab, setTab] = useState<StatsTab>("income");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: wallets = [] } = useQuery({
    queryKey: queryKeys.wallets.all,
    queryFn: () => walletService.getAll(),
  });

  const {
    data: stats = [],
    isPending,
    error,
  } = useQuery({
    queryKey: queryKeys.transactions.monthly(walletId, MONTHS_RANGE),
    queryFn: () =>
      transactionService.monthlyStats({
        walletId: walletId ?? undefined,
        months: MONTHS_RANGE,
      }),
  });

  useRefreshOnFocus(queryKeys.transactions.all);
  useRefreshOnFocus(queryKeys.wallets.all);

  const errorMessage = error
    ? extractApiErrorMessage(error, "Impossible de charger les statistiques.")
    : null;

  const selectedWallet =
    walletId != null
      ? wallets.find((wallet) => wallet.id === walletId)
      : undefined;
  
  const selectedStat =
    selectedIndex != null && selectedIndex >= 0 ? stats[selectedIndex] : stats[stats.length - 1];
  
  const hasData = stats.some((stat) => stat.income > 0 || stat.expenses > 0);

  const walletOptions = [
    { label: "Tous les portefeuilles", value: "all" },
    ...wallets
      .filter((wallet) => wallet.id != null)
      .map((wallet) => ({ label: wallet.name, value: String(wallet.id) })),
  ];

  const currentDisplayAmount = selectedStat
    ? tab === "income"
      ? selectedStat.income
      : selectedStat.expenses
    : 0;

  const displayPeriodLabel = selectedStat
    ? shortMonthLabel(selectedStat.period)
    : "cette période";

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Typo size={22} fontWeight={"600"} style={styles.title}>
            Statistique
          </Typo>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SegmentedControl
            values={["Revenu", "Dépense"]}
            selectedIndex={tab === "income" ? 0 : 1}
            onChange={(event) =>
              setTab(
                event.nativeEvent.selectedSegmentIndex === 0
                  ? "income"
                  : "expense",
              )
            }
            tintColor={tab === "income" ? colors.green : colors.rose}
            backgroundColor={colors.neutral800}
            fontStyle={{ color: colors.neutral400, fontWeight: "500" }}
            activeFontStyle={{ color: colors.white, fontWeight: "600" }}
            style={styles.segment}
          />

          <Dropdown
            style={dropdownStyles.container}
            selectedTextStyle={dropdownStyles.selectedText}
            iconStyle={dropdownStyles.icon}
            activeColor={colors.neutral700}
            placeholder="Sélectionner un portefeuille"
            placeholderStyle={dropdownStyles.placeholder}
            data={walletOptions}
            maxHeight={300}
            labelField="label"
            valueField="value"
            value={walletId != null ? String(walletId) : "all"}
            onChange={(item) =>
              setWalletId(item.value === "all" ? null : Number(item.value))
            }
            itemTextStyle={dropdownStyles.itemText}
            itemContainerStyle={dropdownStyles.itemContainer}
            containerStyle={dropdownStyles.listContainer}
          />

          <View style={styles.chartSection}>
            <View style={styles.summaryContainer}>
              <Typo size={13} color={colors.neutral400} style={styles.summarySubtitle}>
                {tab === "income" ? "Revenu en" : "Dépense en"} {displayPeriodLabel}
              </Typo>
              <Typo size={26} fontWeight={"700"} style={styles.summaryAmount}>
                {currentDisplayAmount.toFixed(2)}€
              </Typo>
            </View>

            {isPending ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : errorMessage ? (
              <Typo
                size={13}
                color={colors.rose}
                style={{ textAlign: "center" }}
              >
                {errorMessage}
              </Typo>
            ) : hasData ? (
              <StatsBarChart
                data={stats}
                type={tab}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
            ) : (
              <Typo
                size={13}
                color={colors.neutral400}
                style={{ textAlign: "center" }}
              >
                Aucune donnée sur cette période
              </Typo>
            )}
          </View>

          {selectedWallet?.goal != null && selectedWallet.goal > 0 && (
            <GoalCard
              goal={selectedWallet.goal}
              amount={selectedWallet.amount ?? 0}
              dataSourcePeriod={selectedStat ? formatPeriod(selectedStat.period) : undefined}
              totalIncome={selectedWallet.totalIncome ?? 0}
              totalExpenses={selectedWallet.totalExpenses ?? 0}
            />
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: spacingY._15,
  },
  title: {
    textAlign: "center",
  },
  content: {
    gap: spacingY._20,
    paddingBottom: verticalScale(40),
  },
  segment: {
    height: verticalScale(44),
    borderRadius: radius._17,
  },
  chartSection: {
    gap: spacingY._12,
    backgroundColor: colors.neutral900,
    borderRadius: radius._17,
    padding: spacingX._20,
    borderCurve: "continuous",
  },
  summaryContainer: {
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  summarySubtitle: {
    textTransform: "capitalize",
    marginBottom: verticalScale(4),
  },
  summaryAmount: {
    letterSpacing: 0.5,
  },
  loading: {
    height: verticalScale(200),
    justifyContent: "center",
    alignItems: "center",
  },
});