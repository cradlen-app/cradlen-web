import type {
  AuthContext,
  PermissionPredicate,
} from "@/common/kernel-contracts";
import type { UserProfile } from "@/common/types/user.types";
import {
  canAccessBilling,
  canManageBillingAdmin,
  canManageOwnPrices,
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
 * - Owner / branch manager → view financial reports.
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

/** View aggregated financial reports. */
function _canViewReports(profile: Profile): boolean {
  return isOwner(profile ?? undefined) || isBranchManager(profile ?? undefined);
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
} as const;

const fromCtx =
  (fn: (profile: Profile) => boolean): PermissionPredicate =>
  (ctx: AuthContext) =>
    fn(ctx.profile as Profile);

export const financialPermissions = {
  "financial.read": fromCtx(_canRead),
  "financial.collectPayment": fromCtx(_canCollectPayment),
  "financial.manageCash": fromCtx(_canManageCash),
  "financial.refund": fromCtx(_canRefund),
  "financial.manageCatalog": fromCtx(_canManageCatalog),
  "financial.managePricing": fromCtx(_canManagePricing),
  "financial.manageProviderPricing": fromCtx(_canManageProviderPricing),
  "financial.captureCharge": fromCtx(_canCaptureCharge),
  "financial.viewReports": fromCtx(_canViewReports),
} as const;
