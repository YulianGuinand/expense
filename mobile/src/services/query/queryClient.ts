import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

const MAX_RETRY_COUNT = 2;

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status !== undefined && status >= 400 && status < 500) {
      return false;
    }
  }
  return failureCount < MAX_RETRY_COUNT;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
    },
  },
});
