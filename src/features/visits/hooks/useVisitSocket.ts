"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "@/lib/queryKeys";

function getWsBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "https://api.cradlen.com/v1";
  return url.replace(/\/v1\/?$/, "");
}

export function useVisitSocket(profileId?: string | null, branchId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_VISITS_MOCK === "true") return;

    let cleanup: (() => void) | undefined;

    import("socket.io-client").then(({ io }) => {
      const socket = io(`${getWsBaseUrl()}/visits`, {
        transports: ["websocket"],
        withCredentials: true,
      });

      socket.on("connect", () => {
        if (profileId) {
          socket.emit("join", { doctorId: profileId });
        }
      });

      socket.on("visit.booked", () => {
        if (branchId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.visits.branch(branchId) });
        } else {
          queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
        }
      });

      socket.on("visit.status_updated", () => {
        if (branchId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.visits.branch(branchId) });
        } else {
          queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
        }
      });

      cleanup = () => socket.disconnect();
    });

    return () => cleanup?.();
  }, [profileId, branchId, queryClient]);
}
