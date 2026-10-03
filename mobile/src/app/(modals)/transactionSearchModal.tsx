import { BackButton } from "@/components/BackButton";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { ModalWrapper } from "@/components/ModalWrapper";
import { TransactionList } from "@/components/TransactionList";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { transactionService } from "@/services/api/transactionService";
import { queryKeys } from "@/services/query/queryKeys";
import { TransactionType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { debounce } from "lodash";
import { MagnifyingGlassIcon, XIcon } from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

export default function TransactionSearchModal() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setQuery(value), DEBOUNCE_MS),
    [],
  );

  useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery]);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.transactions.search(query),
      queryFn: async ({ pageParam }) => {
        const raw = await transactionService.getAll({
          q: query || undefined,
          limit: PAGE_SIZE + 1,
          offset: pageParam,
        });
        return {
          items: raw.slice(0, PAGE_SIZE),
          hasMore: raw.length > PAGE_SIZE,
        };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.hasMore ? lastPageParam + PAGE_SIZE : undefined,
    });

  const transactions = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data],
  );

  const handleChangeText = (value: string) => {
    setInput(value);
    debouncedSetQuery(value.trim());
  };

  const handleClear = () => {
    debouncedSetQuery.cancel();
    setInput("");
    setQuery("");
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handlePressTransaction = (item: TransactionType) => {
    if (item.id == null) return;
    router.push({
      pathname: "/(modals)/transactionModal",
      params: { id: String(item.id) },
    });
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Rechercher"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._15 }}
        />

        <View style={styles.searchRow}>
          <Input
            containerStyle={styles.input}
            placeholder="Nom, catégorie, wallet, type..."
            value={input}
            onChangeText={handleChangeText}
            icon={
              <MagnifyingGlassIcon
                size={verticalScale(20)}
                color={colors.neutral400}
                weight="bold"
              />
            }
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
          />
          {input.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              accessibilityLabel="Effacer la recherche"
            >
              <XIcon
                size={verticalScale(18)}
                color={colors.neutral200}
                weight="bold"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.list}>
          <TransactionList
            data={transactions}
            loading={isLoading}
            emptyListMessage={
              query ? "Aucune transaction trouvée" : "Aucune transaction"
            }
            onPress={handlePressTransaction}
            onEndReached={handleEndReached}
            fetchingMore={isFetchingNextPage}
            fill
          />
        </View>
      </View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingY._20,
    gap: spacingY._15,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  input: {
    flex: 1,
  },
  clearButton: {
    backgroundColor: colors.neutral700,
    padding: spacingX._10,
    borderRadius: 50,
  },
  list: {
    flex: 1,
  },
});
