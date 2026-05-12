/**
 * Owned TanStack Query namespace for the staff module.
 *
 * Other modules consume these keys via `@/core/staff/api` (staffQueryKeys).
 * Internal staff files import directly from this file.
 *
 * The kernel verifies that no other module claims the `staff` root key
 * (see ModuleRegistry registration via manifest.queryKeyRoot).
 */
export const staffQueryKeys = {
  /** Broad key — matches all staff queries. */
  all: () => ["staff"] as const,
  /** Org-level key — matches all staff for an organization (used for invalidation). */
  byOrg: (organizationId: string) => ["staff", organizationId] as const,
  list: (
    organizationId: string,
    opts: {
      q?: string;
      roleId?: string;
      branchId?: string;
      role?: string;
      scope?: "org" | "mine";
    },
  ) =>
    [
      "staff",
      organizationId,
      opts.q,
      opts.roleId,
      opts.branchId,
      opts.role,
      opts.scope,
    ] as const,
  detail: (organizationId: string, branchId: string, staffId: string) =>
    ["staff", "detail", organizationId, branchId, staffId] as const,
  roles: (organizationId: string) => ["staff-roles", organizationId] as const,
  invitationPreview: (invitationId: string, token: string) =>
    ["staff", "invitation-preview", invitationId, token] as const,
  invitations: {
    /** Broad key — matches all invitation queries. */
    all: () => ["staff-invitations"] as const,
    list: (
      organizationId: string,
      opts: { page: number; limit: number; status: string },
    ) =>
      [
        "staff-invitations",
        organizationId,
        opts.page,
        opts.limit,
        opts.status,
      ] as const,
    detail: (organizationId: string, invitationId: string) =>
      ["staff-invitations", "detail", organizationId, invitationId] as const,
  },
} as const;

/** Root key registered with the kernel's QueryKeyRegistry. */
export const STAFF_QUERY_KEY_ROOT = ["staff"] as const;
