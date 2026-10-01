import { colors, spacingY } from "@/constants/theme";
import { ModalWrapperProps } from "@/types";
import { Platform, StyleSheet, View } from "react-native";

const isIos = Platform.OS === "ios";

export function ModalWrapper({
  style,
  children,
  bg = colors.neutral800,
}: ModalWrapperProps) {
  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: isIos ? spacingY._15 : 50,
    paddingBottom: isIos ? spacingY._20 : 10,
  },
});
