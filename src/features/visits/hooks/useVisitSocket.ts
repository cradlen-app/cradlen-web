"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { queryKeys } from "@/lib/queryKeys";

function getWsBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "https://api.cradlen.com/v1";
  return url.replace(/\/v1\/?$/, "");
}

export function useVisitSocket(profileId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_VISITS_MOCK === "true") return;

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
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
    });

    socket.on("visit.status_updated", () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
    });

    return () => {
      socket.disconnect();
    };
  }, [profileId, queryClient]);
}
