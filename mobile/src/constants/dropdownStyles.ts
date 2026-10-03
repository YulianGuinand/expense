import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { StyleSheet } from "react-native";

export const dropdownStyles = StyleSheet.create({
  container: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  itemText: {
    color: colors.white,
  },
  selectedText: {
    color: colors.white,
    fontSize: verticalScale(14),
  },
  listContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: "continuous",
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  placeholder: {
    color: colors.white,
  },
  itemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },
  icon: {
    height: verticalScale(30),
    tintColor: colors.neutral300,
  },
});
