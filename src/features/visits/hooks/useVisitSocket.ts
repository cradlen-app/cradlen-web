"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { queryKeys } from "@/lib/queryKeys";

function getWsBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "https://api.cradlen.com/v1";
  return url.replace(/\/v1\/?$/, "");
}

const VISIT_EVENTS = [
  "visit.booked",
  "visit.status_updated",
  "visit.updated",
  "medical_rep_visit.booked",
  "medical_rep_visit.status_updated",
  "medical_rep_visit.updated",
] as const;

export function useVisitSocket(
  profileId?: string | null,
  branchId?: string | null,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profileId && !branchId) return;

    const socket: Socket = io(`${getWsBaseUrl()}/visits`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join", {
        ...(profileId ? { doctorId: profileId } : {}),
        ...(branchId ? { branchId } : {}),
      });
    });

    socket.on("connect_error", (err: Error) => {
      console.error("[visit-socket] connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.medicalRepVisits.all(),
      });
    };

    for (const event of VISIT_EVENTS) {
      socket.on(event, invalidate);
    }

    return () => {
      socket.disconnect();
    };
  }, [profileId, branchId, queryClient]);
}