import { colors } from "@/constants/theme";
import { AnimatedBlobatar } from "@blobatar/react-native/animated";
import { memo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export interface BlobatarAvatarProps {
  name: string;
  size: number;
  style?: ViewStyle;
}

export const BlobatarAvatar = memo(
  ({ name, size, style }: BlobatarAvatarProps) => {
    const seed =
      name && name.trim().length > 0
        ? name.trim().toLowerCase()
        : "expense_default";

    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      >
        <AnimatedBlobatar name={seed} size={size} animate />
      </View>
    );
  },
);

BlobatarAvatar.displayName = "BlobatarAvatar";

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral700,
  },
});
