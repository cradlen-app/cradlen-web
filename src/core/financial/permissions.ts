import type {
  AuthContext,
  PermissionPredicate,
} from "@/common/kernel-contracts";
import { PERMISSIONS } from "@/common/kernel-contracts";
import type { UserProfile } from "@/common/types/user.types";
import {
  canAccessBilling,
  canManageBillingAdmin,
  canManageOwnPrices,
  canPracticeSpecialty,
  isAccountant,
  isBranchManager,
  isDoctor,
  isOwner,
} from "@/features/auth/lib/permissions";

/**
 * Financial module permissions.
 *
 * Two flavors are exposed (mirrors `@/core/staff/permissions`):
 *
 * - `financialCan.{...}` — pure helpers taking a `UserProfile`, for non-React
 *   callers (route guards, derived selectors).
 * - `financialPermissions` — kernel `PermissionPredicate` map registered with
 *   the kernel so components can use `usePermission('financial.read')`.
 *
 * Role split:
 * - Front-desk / accountant / owner → view invoices, collect payments, run
 *   cash sessions, issue refunds (`canAccessBilling`).
 * - Owner only → manage the service catalog and org pricing
 *   (`canManageBillingAdmin`).
 * - Clinical staff → manage their own provider price overrides
 *   (`canManageOwnPrices`).
 * - Doctors (and owners) → capture charges on a visit.
 * - Owner / branch manager → view org-wide financial reports; a matched-specialty
 *   clinician → view their own (server-scoped) revenue reports.
 */

type Profile = UserProfile | null | undefined;

/** View invoices, payments, cash, refunds — the operational front-desk surface. */
function _canRead(profile: Profile): boolean {
  return canAccessBilling(profile ?? undefined);
}

/** Collect a payment against an issued invoice. */
function _canCollectPayment(profile: Profile): boolean {
  return canAccessBilling(profile ?? undefined);
}

/** Open / close / reconcile a cash session. */
function _canManageCash(profile: Profile): boolean {
  return canAccessBilling(profile ?? undefined);
}

/** Issue or void a refund against a completed payment. */
function _canRefund(profile: Profile): boolean {
  return canAccessBilling(profile ?? undefined);
}

/** Manage the service catalog (services + categories) and org price lists. */
function _canManageCatalog(profile: Profile): boolean {
  return canManageBillingAdmin(profile ?? undefined);
}

/** Manage org-level pricing config (price lists, items). */
function _canManagePricing(profile: Profile): boolean {
  return canManageBillingAdmin(profile ?? undefined);
}

/** Manage provider-specific price overrides. */
function _canManageProviderPricing(profile: Profile): boolean {
  return canManageBillingAdmin(profile ?? undefined) || canManageOwnPrices(profile ?? undefined);
}

/** Add a service/charge to a patient's visit. */
function _canCaptureCharge(profile: Profile): boolean {
  return isDoctor(profile ?? undefined) || isOwner(profile ?? undefined);
}

/**
 * View aggregated financial reports across providers. Owners get org-wide ("All
 * Branches"); branch managers and back-office accountants get the same full
 * report layout scoped to their assigned branch (the org-wide option and
 * cross-branch analytics stay owner-only in `ReportsPage`).
 */
function _canViewReports(profile: Profile): boolean {
  return (
    isOwner(profile ?? undefined) ||
    isBranchManager(profile ?? undefined) ||
    isAccountant(profile ?? undefined)
  );
}

/**
 * View one's OWN revenue reports — a matched-specialty clinician. The data is
 * scoped to the requesting doctor server-side; this only gates visibility of a
 * personal (not org-wide) reports view.
 */
function _canViewOwnReports(profile: Profile): boolean {
  return canPracticeSpecialty(profile ?? undefined);
}

/**
 * Reports nav/route gate: either an org-wide viewer (owner / branch manager) or
 * a matched clinician viewing their own revenue. The `ReportsPage` itself reads
 * the org-wide flag to decide between the full dashboard and the own-scoped view.
 */
function _canViewReportsNav(profile: Profile): boolean {
  return _canViewReports(profile) || _canViewOwnReports(profile);
}

export const financialCan = {
  read: _canRead,
  collectPayment: _canCollectPayment,
  manageCash: _canManageCash,
  refund: _canRefund,
  manageCatalog: _canManageCatalog,
  managePricing: _canManagePricing,
  manageProviderPricing: _canManageProviderPricing,
  captureCharge: _canCaptureCharge,
  viewReports: _canViewReports,
  viewOwnReports: _canViewOwnReports,
  viewReportsNav: _canViewReportsNav,
} as const;

const fromCtx =
  (fn: (profile: Profile) => boolean): PermissionPredicate =>
  (ctx: AuthContext) =>
    fn(ctx.profile as Profile);

export const financialPermissions = {
  [PERMISSIONS.financialRead]: fromCtx(_canRead),
  [PERMISSIONS.financialCollectPayment]: fromCtx(_canCollectPayment),
  [PERMISSIONS.financialManageCash]: fromCtx(_canManageCash),
  [PERMISSIONS.financialRefund]: fromCtx(_canRefund),
  [PERMISSIONS.financialManageCatalog]: fromCtx(_canManageCatalog),
  [PERMISSIONS.financialManagePricing]: fromCtx(_canManagePricing),
  [PERMISSIONS.financialManageProviderPricing]: fromCtx(
    _canManageProviderPricing,
  ),
  [PERMISSIONS.financialCaptureCharge]: fromCtx(_canCaptureCharge),
  [PERMISSIONS.financialViewReports]: fromCtx(_canViewReports),
  [PERMISSIONS.financialViewOwnReports]: fromCtx(_canViewOwnReports),
  [PERMISSIONS.financialViewReportsNav]: fromCtx(_canViewReportsNav),
} as const;
