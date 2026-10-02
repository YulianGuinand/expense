import { BlobatarAvatar } from "@/components/Avatar/BlobatarAvatar";
import { Button } from "@/components/Button";
import { HomeCard } from "@/components/HomeCard";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { TransactionList } from "@/components/TransactionList";
import { Typo } from "@/components/Typo";
import { mockTransactions } from "@/constants/data";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import { MagnifyingGlassIcon, PlusIcon } from "phosphor-react-native";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

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
            <TouchableOpacity style={styles.searchItem}>
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
          {/* card */}
          <View>
            <HomeCard />
          </View>

          <TransactionList
            title="Récentes Transactions"
            data={mockTransactions}
            loading={false}
            emptyListMessage="Aucune transactions ajoutées"
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
