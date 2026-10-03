import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

export function useRefreshOnFocus(queryKey: QueryKey) {
  const queryClient = useQueryClient();
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      queryClient.refetchQueries({
        queryKey,
        stale: true,
        type: "active",
      });
    }, [queryClient, queryKey]),
  );
}
