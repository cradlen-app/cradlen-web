import { registerSessionBridge } from "@/infrastructure/auth-transport/session-bridge";
import { useAuthStore } from "../store/authStore";
import { useAuthContextStore } from "../store/authContextStore";
import { useUserStore } from "../store/userStore";

/**
 * Registers the auth feature's stores with the infrastructure session bridge so
 * `infrastructure/http/api.ts` can read the request context and tear down the
 * session without importing this feature. Called once at client boot from
 * `components/Providers`.
 */
export function initAuthSessionBridge(): void {
  registerSessionBridge({
    readContext: () => {
      const { organizationId, branchId, profileId } =
        useAuthContextStore.getState();
      return { organizationId, branchId, profileId };
    },
    clearSession: () => {
      useAuthStore.getState().clearSession();
      useAuthContextStore.getState().clearContext();
      useUserStore.getState().clearUser();
    },
  });
}
