import { colors } from "@/constants/theme";
import { ScreenWrapperProps } from "@/types";
import { Dimensions, Platform, StatusBar, View } from "react-native";

const { height } = Dimensions.get("window");

export function ScreenWrapper({ style, children }: ScreenWrapperProps) {
  const paddingTop = Platform.OS === "ios" ? height * 0.06 : 50;
  return (
    <View
      style={[
        { paddingTop, flex: 1, backgroundColor: colors.neutral900 },
        style,
      ]}
    >
      <StatusBar barStyle={"light-content"} />
      {children}
    </View>
  );
}
