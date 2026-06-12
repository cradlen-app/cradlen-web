"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { queryKeys } from "@/lib/queryKeys";

function getWsBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "https://api.cradlen.com/v1";
  return url.replace(/\/v1\/?$/, "");
}

/**
 * Fetches a fresh short-lived handshake ticket from the BFF. Called by the
 * socket on every (re)connect attempt, so an expired ticket (or a reconnect
 * after a network blip) always re-authenticates with a new one. Returns `""` on
 * failure so the gateway rejects the connect rather than hanging.
 */
async function fetchWsTicket(
  profileId?: string | null,
  branchId?: string | null,
): Promise<string> {
  try {
    // Forward the active context so the BFF's selection-token fallback can
    // recover a session if both the access and refresh cookies have lapsed
    // (the normal path resolves straight off the httpOnly cookies).
    const headers: Record<string, string> = {};
    if (profileId) headers["X-Profile-Id"] = profileId;
    if (branchId) headers["X-Branch-Id"] = branchId;

    const res = await fetch("/api/auth/ws-ticket", {
      method: "POST",
      credentials: "include",
      headers,
    });
    if (!res.ok) return "";
    const json = (await res.json()) as { data?: { ws_ticket?: string } };
    return json?.data?.ws_ticket ?? "";
  } catch {
    return "";
  }
}

const VISIT_EVENTS = [
  "visit.booked",
  "visit.status_updated",
  "visit.updated",
  "medical_rep_visit.booked",
  "medical_rep_visit.status_updated",
  "medical_rep_visit.updated",
] as const;

/** Payload the server emits when a doctor adds a billable service mid-visit. */
export type BillingChargeAddedPayload = {
  branch_id: string;
  patient_id: string;
  visit_id: string | null;
  service_id: string | null;
  amount: string;
};

export function useVisitSocket(
  profileId?: string | null,
  branchId?: string | null,
  /**
   * Called when the branch receives a `billing.charge_added` push (a doctor
   * added a chargeable service). Provided by billing-aware surfaces (reception)
   * to surface a toast; omitted elsewhere.
   */
  onBillingChargeAdded?: (payload: BillingChargeAddedPayload) => void,
) {
  const queryClient = useQueryClient();

  // Keep the latest billing callback in a ref so it can change between renders
  // without tearing down and re-authenticating the socket.
  const onBillingChargeAddedRef = useRef(onBillingChargeAdded);
  useEffect(() => {
    onBillingChargeAddedRef.current = onBillingChargeAdded;
  }, [onBillingChargeAdded]);

  useEffect(() => {
    if (!profileId && !branchId) return;

    const socket: Socket = io(`${getWsBaseUrl()}/visits`, {
      // Re-invoked by socket.io on every (re)connect attempt → always a fresh
      // ticket. The gateway derives rooms from the verified ticket, so no
      // client-side `join` is needed.
      auth: async (cb) => {
        cb({ token: await fetchWsTicket(profileId, branchId) });
      },
      // Fall back to HTTP long-polling if a proxy/firewall blocks WebSocket.
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect_error", (err: Error) => {
      console.error("[visit-socket] connection error:", err.message);
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

    socket.on("billing.charge_added", (payload: BillingChargeAddedPayload) => {
      onBillingChargeAddedRef.current?.(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [profileId, branchId, queryClient]);
}