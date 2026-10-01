import { colors, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import {
  ChartBarIcon,
  HouseIcon,
  UserIcon,
  WalletIcon,
} from "phosphor-react-native";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

export function CustomTabs({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const tabbarIcons: any = {
    index: (isFocused: boolean) => (
      <HouseIcon
        size={verticalScale(24)}
        weight={isFocused ? "fill" : "regular"}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    statistics: (isFocused: boolean) => (
      <ChartBarIcon
        size={verticalScale(24)}
        weight={isFocused ? "fill" : "regular"}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    wallet: (isFocused: boolean) => (
      <WalletIcon
        size={verticalScale(24)}
        weight={isFocused ? "fill" : "regular"}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    profile: (isFocused: boolean) => (
      <UserIcon
        size={verticalScale(24)}
        weight={isFocused ? "fill" : "regular"}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
  };

  return (
    <View style={styles.tabbarContainer}>
      <View style={styles.tabbar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabbarItem}
            >
              {tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabbarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(16),
    paddingBottom: Platform.OS === "ios" ? spacingY._10 : spacingY._17,
    backgroundColor: "transparent",
  },
  tabbar: {
    flexDirection: "row",
    width: "100%",
    height: Platform.OS === "ios" ? verticalScale(65) : verticalScale(60),
    backgroundColor: colors.neutral800,
    borderRadius: verticalScale(35),
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: scale(6),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tabbarItem: {
    flex: 1,
    height: verticalScale(45),
    justifyContent: "center",
    alignItems: "center",
  },
});
