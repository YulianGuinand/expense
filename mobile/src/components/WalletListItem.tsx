import { colors, radius, spacingX } from "@/constants/theme";
import { WalletType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { ImperativeRouter } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BlobatarAvatar } from "./Avatar/BlobatarAvatar";
import { Typo } from "./Typo";

export function WalletListItem({
  item,
  index,
  router,
}: {
  item: WalletType;
  index: number;
  router: ImperativeRouter;
}) {
  const openWallet = () => {
    if (item.id == null) return;

    router.push({
      pathname: "/(modals)/walletModal",
      params: {
        id: String(item.id),
        name: item.name,
      },
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()
        .damping(60)}
    >
      <TouchableOpacity style={styles.container} onPress={openWallet}>
        <View style={styles.imageContainer}>
          <BlobatarAvatar name={item?.name} size={verticalScale(40)} />
        </View>
        <View style={styles.nameContainer}>
          <Typo size={16}>{item?.name}</Typo>
          <Typo size={14} color={colors.neutral400}>
            {Number(item?.amount ?? 0).toFixed(2)}€
          </Typo>
        </View>
        <CaretRightIcon
          size={verticalScale(20)}
          weight="bold"
          color={colors.white}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(17),
  },
  imageContainer: {
    height: verticalScale(45),
    width: verticalScale(45),
    borderWidth: 1,
    borderColor: colors.neutral700,
    borderRadius: radius._12,
    borderCurve: "continuous",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral700,
  },
  nameContainer: {
    flex: 1,
    gap: 2,
    marginLeft: spacingX._10,
  },
});
