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

    // cancelled guards against the race where cleanup runs before the
    // dynamic import resolves, which would leave the socket connected.
    let cancelled = false;
    let disconnect: (() => void) | undefined;

    import("socket.io-client").then(({ io }) => {
      if (cancelled) return;

      const socket = io(`${getWsBaseUrl()}/visits`, {
        transports: ["websocket"],
        withCredentials: true,
      });

      socket.on("connect", () => {
        if (profileId) socket.emit("join", { doctorId: profileId });
      });

      socket.on("connect_error", (err) => {
        console.error("[visit-socket] connection error:", err.message);
      });

      socket.on("disconnect", (reason) => {
        // Server-initiated disconnects need an explicit reconnect.
        if (reason === "io server disconnect") {
          socket.connect();
        }
      });

      const invalidate = () => {
        if (branchId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.visits.branch(branchId) });
        } else {
          queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
        }
      };

      socket.on("visit.booked", invalidate);
      socket.on("visit.status_updated", invalidate);

      disconnect = () => socket.disconnect();
    });

    return () => {
      cancelled = true;
      disconnect?.();
    };
  }, [profileId, branchId, queryClient]);
}
