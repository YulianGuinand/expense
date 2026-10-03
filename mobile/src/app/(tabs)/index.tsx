import { BlobatarAvatar } from "@/components/Avatar/BlobatarAvatar";
import { Button } from "@/components/Button";
import { HomeCard } from "@/components/HomeCard";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { TransactionList } from "@/components/TransactionList";
import { Typo } from "@/components/Typo";
import { dropdownStyles } from "@/constants/dropdownStyles";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { extractApiErrorMessage } from "@/services/api/apiClient";
import { transactionService } from "@/services/api/transactionService";
import { walletService } from "@/services/api/walletService";
import { queryKeys } from "@/services/query/queryKeys";
import { verticalScale } from "@/utils/styling";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { MagnifyingGlassIcon, PlusIcon } from "phosphor-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);

  const { data: wallets = [], isPending: isWalletsPending } = useQuery({
    queryKey: queryKeys.wallets.all,
    queryFn: () => walletService.getAll(),
  });

  const selectedWallet =
    wallets.find((wallet) => wallet.id === selectedWalletId) ??
    (wallets.length > 0 ? wallets[0] : undefined);
  const walletId = selectedWallet?.id;

  const {
    data: transactions = [],
    isPending: isTransactionsPending,
    error,
  } = useQuery({
    queryKey: queryKeys.transactions.list(walletId ?? 0),
    queryFn: async () => {
      if (walletId == null) return [];
      return transactionService.getAll({ walletId, limit: 10 });
    },
    enabled: walletId != null,
  });

  useRefreshOnFocus(queryKeys.transactions.all);

  const errorMessage = error
    ? extractApiErrorMessage(error, "Impossible de charger vos transactions.")
    : null;

  const listLoading = walletId != null ? isTransactionsPending : isWalletsPending;
  const emptyListMessage =
    walletId == null && !isWalletsPending
      ? "Aucun portefeuille disponible"
      : (errorMessage ?? "Aucune transaction dans ce portefeuille");

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>
              Salut,{" "}
            </Typo>
            <Typo size={20} fontWeight={"500"}>
              {user?.username || "Bienvenue"}
            </Typo>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              style={styles.searchItem}
              onPress={() => router.push("/(modals)/transactionSearchModal")}
            >
              <MagnifyingGlassIcon
                size={verticalScale(22)}
                color={colors.neutral200}
                weight="bold"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <BlobatarAvatar
                name={user?.username || user?.email || "expense"}
                size={verticalScale(42)}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
        >
          {/* wallet selector */}
          <Dropdown
            style={dropdownStyles.container}
            selectedTextStyle={dropdownStyles.selectedText}
            iconStyle={dropdownStyles.icon}
            activeColor={colors.neutral700}
            placeholder="Sélectionner un portefeuille"
            placeholderStyle={dropdownStyles.placeholder}
            data={wallets
              .filter((wallet) => wallet.id != null)
              .map((wallet) => ({
                label: wallet.name,
                value: String(wallet.id),
              }))}
            maxHeight={300}
            labelField="label"
            valueField="value"
            value={walletId != null ? String(walletId) : null}
            onChange={(item) => setSelectedWalletId(Number(item.value))}
            itemTextStyle={dropdownStyles.itemText}
            itemContainerStyle={dropdownStyles.itemContainer}
            containerStyle={dropdownStyles.listContainer}
          />

          {/* card */}
          <View>
            <HomeCard
              balance={selectedWallet?.amount ?? 0}
              totalIncome={selectedWallet?.totalIncome ?? 0}
              totalExpenses={selectedWallet?.totalExpenses ?? 0}
              loading={isWalletsPending}
            />
          </View>

          {errorMessage && (
            <Typo size={13} color={colors.rose} style={{ textAlign: "center" }}>
              {errorMessage}
            </Typo>
          )}

          <TransactionList
            title="Récentes Transactions"
            data={transactions}
            loading={listLoading}
            emptyListMessage={emptyListMessage}
            onPress={(item) => {
              if (item.id == null) return;
              router.push({
                pathname: "/(modals)/transactionModal",
                params: { id: String(item.id) },
              });
            }}
          />
        </ScrollView>

        <Button
          style={styles.floatingButton}
          onPress={() => router.push("/(modals)/transactionModal")}
        >
          <PlusIcon
            color={colors.black}
            weight="bold"
            size={verticalScale(24)}
          />
        </Button>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  searchItem: {
    backgroundColor: colors.neutral700,
    padding: spacingX._10,
    borderRadius: 50,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(85),
    right: verticalScale(30),
  },
  scrollViewStyle: {
    marginTop: spacingY._10,
    paddingBottom: verticalScale(100),
    gap: spacingY._25,
  },
});
