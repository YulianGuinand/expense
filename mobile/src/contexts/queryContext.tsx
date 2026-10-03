import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { AppState, Platform } from "react-native";
import type { AppStateStatus } from "react-native";
import { queryClient } from "@/services/query/queryClient";

const handleAppStateChange = (status: AppStateStatus) => {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
};

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
