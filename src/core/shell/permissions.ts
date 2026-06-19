import type {
  AuthContext,
  PermissionPredicate,
} from "@/common/kernel-contracts";
import { PERMISSIONS } from "@/common/kernel-contracts";
import {
  canAccessClinicalWorkspace,
  canAccessOperations,
  canOpenMedicalRepOverview,
  canOpenPatientWorkspace,
  canPracticeSpecialty,
  canUseSettings,
  hasAnyStaffRole,
  isAccountant,
  isBranchManager,
  isOwner,
  isReceptionist,
} from "@/features/auth/lib/permissions";
import type { UserProfile } from "@/common/types/user.types";

/**
 * Transitional "shell" permissions — visibility gates for the top-level nav
 * items that haven't migrated to their own core module yet. Each wraps an
 * existing helper from `features/auth/lib/permissions` so there is a single
 * implementation of the role math. Move each predicate into the owning module
 * as features migrate.
 *
 * NOTE: these gate *sidebar visibility*. Route access is derived from the same
 * permission ids by `components/layout/dashboard-access.ts` — including the
 * dashboard root, which is gated by `dashboard.home` (reception excluded). The
 * redirect loop this would otherwise cause is avoided by routing denied users to
 * their role-aware default (e.g. reception → `/visits`) instead of the root.
 */
type Profile = UserProfile | null | undefined;

/**
 * Home dashboard overview — every staff member except the front-desk receptionist
 * and the back-office accountant, both of whom have their own default workspace
 * (reception → /visits, accountant → /financial).
 */
function _canSeeDashboardHome(profile: Profile): boolean {
  const p = profile ?? undefined;
  return hasAnyStaffRole(p) && !isReceptionist(p) && !isAccountant(p);
}

const fromCtx =
  (fn: (profile: Profile) => boolean): PermissionPredicate =>
  (ctx: AuthContext) =>
    fn(ctx.profile as Profile);

/**
 * Medicine catalogue is clinical-facing, but only for clinicians whose specialty
 * the organization actually supports — a mismatched-specialty doctor can't
 * practice here, so the catalogue (and prescribing) stays hidden. Owners and
 * branch managers always see it.
 */
function _canAccessMedicine(profile: Profile): boolean {
  const p = profile ?? undefined;
  return isOwner(p) || isBranchManager(p) || canPracticeSpecialty(p);
}

export const shellPermissions = {
  [PERMISSIONS.dashboardHome]: fromCtx(_canSeeDashboardHome),
  [PERMISSIONS.operationsView]: fromCtx((p) =>
    canAccessOperations(p ?? undefined),
  ),
  [PERMISSIONS.clinicalWorkspaceView]: fromCtx((p) =>
    canAccessClinicalWorkspace(p ?? undefined),
  ),
  // Route-only gate (no nav item): the patient *detail* workspace.
  [PERMISSIONS.patientDetailView]: fromCtx((p) =>
    canOpenPatientWorkspace(p ?? undefined),
  ),
  [PERMISSIONS.medicineRead]: fromCtx(_canAccessMedicine),
  [PERMISSIONS.medicalRepView]: fromCtx((p) =>
    canOpenMedicalRepOverview(p ?? undefined),
  ),
  // Route-only gates (no nav item): the settings page self-gates its sections,
  // while deeper org-settings drill-downs are owner-only.
  [PERMISSIONS.settingsView]: fromCtx((p) => canUseSettings(p ?? undefined)),
  [PERMISSIONS.settingsManageOrg]: fromCtx((p) => isOwner(p ?? undefined)),
} as const;
