import { colors } from "@/constants/theme";
import AuthProvider from "@/contexts/authContext";
import { Stack } from "expo-router";

function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral900 },
        headerStyle: { backgroundColor: colors.neutral900 },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="(modals)/profileModal"
        options={{
          presentation: "modal",
          contentStyle: { backgroundColor: colors.neutral900 },
        }}
      />
      <Stack.Screen
        name="(modals)/walletModal"
        options={{
          presentation: "modal",
          contentStyle: { backgroundColor: colors.neutral900 },
        }}
      />
      <Stack.Screen
        name="(modals)/transactionModal"
        options={{
          presentation: "modal",
          contentStyle: { backgroundColor: colors.neutral900 },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StackLayout />
    </AuthProvider>
  );
}
