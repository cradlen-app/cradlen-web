/**
 * Centralized TanStack Query key factory.
 *
 * All query keys live here so cache invalidation is consistent across the app.
 * Use these helpers everywhere instead of inline string arrays.
 */
export const queryKeys = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: () => ["currentUser"] as const,
  registrationStatus: (email: string) => ["registration-status", email] as const,

  // ── Visits ────────────────────────────────────────────────────────────────
  visits: {
    /** Broad key — matches all visit queries for any branch. */
    all: () => ["visits"] as const,
    /** Branch-level key — matches all visit queries for a given branch. */
    branch: (branchId: string) => ["visits", branchId] as const,
    schedule: (branchId: string, date: string, assignedToMe: boolean) =>
      ["visits", branchId, "schedule", date, assignedToMe] as const,
    stats: (branchId: string, date: string, assignedToMe: boolean) =>
      ["visits", branchId, "stats", date, assignedToMe] as const,
    branchWaitingList: (
      branchId: string,
      opts: { page: number; limit: number },
    ) => ["visits", branchId, "waiting-list", opts] as const,
    branchInProgress: (branchId: string) =>
      ["visits", branchId, "in-progress"] as const,
    myWaitingList: (opts: { page: number; limit: number }) =>
      ["visits", "my-waiting-list", opts] as const,
    myCurrent: () => ["visits", "my-current"] as const,
    byId: (visitId: string) => ["visits", "detail", visitId] as const,
  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  staff: {
    /** Broad key — matches all staff queries. */
    all: () => ["staff"] as const,
    /** Org-level key — matches all staff for an organization (used for invalidation). */
    byOrg: (organizationId: string) => ["staff", organizationId] as const,
    list: (
      organizationId: string,
      opts: { q?: string; roleId?: string; branchId?: string; role?: string },
    ) =>
      [
        "staff",
        organizationId,
        opts.q,
        opts.roleId,
        opts.branchId,
        opts.role,
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
  },

  // ── Patients ──────────────────────────────────────────────────────────────
  patients: {
    list: (branchId: string, opts: { search?: string; journeyStatus?: string }) =>
      ["patients", branchId, opts.search, opts.journeyStatus] as const,
    search: (query: string) => ["patients", "search", query] as const,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    /** Broad key — matches all notification queries. */
    all: () => ["notifications"] as const,
    list: (opts: { page: number; limit: number; category?: string }) =>
      ["notifications", opts] as const,
  },

  // ── Calendar ──────────────────────────────────────────────────────────────
  calendar: {
    /** Broad key — matches all calendar queries. */
    all: () => ["calendar"] as const,
    events: (branchId: string | undefined, from: string, to: string) =>
      ["calendar", "events", branchId, from, to] as const,
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    branches: (organizationId: string) => ["branches", organizationId] as const,
  },
} as const;
