import { Loading } from "@/components/Loading";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Typo } from "@/components/Typo";
import { WalletListItem } from "@/components/WalletListItem";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { extractApiErrorMessage } from "@/services/api/apiClient";
import { walletService } from "@/services/api/walletService";
import { queryKeys } from "@/services/query/queryKeys";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { PlusCircleIcon } from "phosphor-react-native";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function Wallet() {
  const router = useRouter();

  const {
    data: wallets = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.wallets.all,
    queryFn: () => walletService.getAll(),
  });

  useRefreshOnFocus(queryKeys.wallets.all);

  const errorMessage = error
    ? extractApiErrorMessage(error, "Impossible de charger vos portefeuilles.")
    : null;

  const getTotalBalance = () =>
    wallets.reduce((total, item) => {
      total = total + (item.amount || 0);
      return total;
    }, 0);

  const renderContent = () => {
    if (isLoading) {
      return <Loading />;
    }

    if (errorMessage && wallets.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Typo size={15} color={colors.neutral300} style={styles.stateText}>
            {errorMessage}
          </Typo>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Typo size={15} color={colors.primary} fontWeight={"600"}>
              Réessayer
            </Typo>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={wallets}
        renderItem={({ item, index }) => {
          return <WalletListItem item={item} index={index} router={router} />;
        }}
        contentContainerStyle={styles.listStyle}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.stateContainer}>
            <Typo size={15} color={colors.neutral300}>
              Aucun portefeuille pour le moment.
            </Typo>
            <Typo size={14} color={colors.neutral500} style={styles.stateText}>
              Appuyez sur + pour en créer un.
            </Typo>
          </View>
        }
      />
    );
  };

  return (
    <ScreenWrapper style={{ backgroundColor: colors.black }}>
      <View style={styles.container}>
        {/* balance */}
        <View style={styles.balanceView}>
          <View style={{ alignItems: "center" }}>
            <Typo size={45} fontWeight={"500"}>
              {getTotalBalance()?.toFixed(2)}€
            </Typo>
            <Typo size={16} color={colors.neutral300}>
              Solde Total
            </Typo>
          </View>
        </View>

        {/* wallets */}
        <View style={styles.wallets}>
          {/* header */}
          <View style={styles.flexRow}>
            <Typo size={20} fontWeight={"500"}>
              Mes Portefeuilles
            </Typo>
            <TouchableOpacity
              onPress={() => router.push("/(modals)/walletModal")}
            >
              <PlusCircleIcon
                weight="fill"
                color={colors.primary}
                size={verticalScale(33)}
              />
            </TouchableOpacity>
          </View>

          {errorMessage && wallets.length > 0 && (
            <Typo size={13} color={colors.rose} style={styles.inlineError}>
              {errorMessage}
            </Typo>
          )}

          {/* wallets list */}
          {renderContent()}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listStyle: {
    flexGrow: 1,
    paddingVertical: spacingY._25,
    paddingTop: spacingY._15,
  },
  wallets: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderTopRightRadius: radius._30,
    borderTopLeftRadius: radius._30,
    padding: spacingX._20,
    paddingTop: spacingX._25,
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  balanceView: {
    height: verticalScale(160),
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  stateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacingY._15,
    paddingVertical: spacingY._30,
  },
  stateText: {
    textAlign: "center",
    paddingHorizontal: spacingX._20,
  },
  retryButton: {
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
  },
  inlineError: {
    marginBottom: spacingY._10,
    textAlign: "center",
  },
});
