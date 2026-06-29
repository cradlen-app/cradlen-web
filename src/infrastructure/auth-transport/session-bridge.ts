/**
 * Session bridge — inverts the dependency between the HTTP transport and the
 * auth feature. `infrastructure/http/api.ts` needs two things the auth feature
 * owns: the active org/branch/profile context (for outbound request headers) and
 * a way to tear down the client session on a confirmed 401. Rather than import
 * `features/auth` stores up into infrastructure, the auth feature registers an
 * implementation at boot (see `features/auth/lib/auth-session-bridge`).
 *
 * Before registration (or on the server) the readers return an anonymous context
 * and the teardown is a no-op, so an early call degrades gracefully.
 */

export type ClientAuthContext = {
  organizationId: string | null;
  branchId: string | null;
  profileId: string | null;
};

export type SessionBridge = {
  /** The active org/branch/profile context for request headers. */
  readContext: () => ClientAuthContext;
  /** Clear the client-side auth/session stores (does NOT touch the query cache). */
  clearSession: () => void;
};

const ANONYMOUS_CONTEXT: ClientAuthContext = {
  organizationId: null,
  branchId: null,
  profileId: null,
};

let bridge: SessionBridge | null = null;

export function registerSessionBridge(impl: SessionBridge): void {
  bridge = impl;
}

export function readClientAuthContext(): ClientAuthContext {
  return bridge?.readContext() ?? ANONYMOUS_CONTEXT;
}

export function clearClientSession(): void {
  bridge?.clearSession();
}
