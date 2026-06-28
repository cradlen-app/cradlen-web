"use client";

import { useMemo, useState } from "react";
import { AlertDialog } from "radix-ui";
import { useQuery } from "@tanstack/react-query";
import { Plus, Power, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { listBranches } from "@/features/settings/lib/settings.api";
import { useStaff } from "@/core/staff/api";

import {
  useProviderServices,
  useRevokeProviderService,
  useToggleProviderServiceActive,
} from "../../hooks/useAuthorizations";
import { financialQueryKeys } from "../../queryKeys";
import type { ProviderServiceAuthorization } from "../../types/financial.types";
import { AuthorizeServiceDrawer } from "./AuthorizeServiceDrawer";

/**
 * Owner-facing service authorizations: pick a clinical provider, then manage
 * which services they're authorized to deliver (optionally branch-scoped).
 * Mirrors `ProviderPricingSubSection` but for ProviderService authorizations.
 */
export function AuthorizationsSubSection() {
  const t = useTranslations("financial.authorizations");
  const tCommon = useTranslations("financial.common");
  const orgId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);

  const staffQuery = useStaff(orgId ?? undefined, branchId ?? undefined);
  const providers = (staffQuery.data ?? []).filter((m) => m.isClinical);

  const branchesQuery = useQuery({
    queryKey: financialQueryKeys.branches(orgId ?? ""),
    queryFn: () => listBranches(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
  const branches = useMemo(
    () => branchesQuery.data?.data ?? [],
    [branchesQuery.data],
  );
  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  const [profileId, setProfileId] = useState("");
  const { authorizations, isLoading } = useProviderServices(
    profileId || undefined,
  );
  const toggleActive = useToggleProviderServiceActive(profileId);
  const revoke = useRevokeProviderService(profileId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] =
    useState<ProviderServiceAuthorization | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-gray-900">{t("title")}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{t("description")}</p>
        </div>
        {profileId && (
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={() => setDrawerOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t("authorizeService")}
          </Button>
        )}
      </div>

      {/* Provider picker */}
      <label className="flex max-w-xs flex-col gap-1 text-xs text-gray-500">
        {t("selectProvider")}
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">{t("selectPrompt")}</option>
          {providers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
      </label>

      {staffQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">
          {t("loadingProviders")}
        </p>
      ) : !profileId ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">{t("pickPrompt")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              {tCommon("loading")}
            </div>
          ) : authorizations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-gray-700">{t("noneYet")}</p>
              <p className="mt-1 text-sm text-gray-400">{t("clickAuthorize")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2.5 text-start font-medium">
                    {t("fields.service")}
                  </th>
                  <th className="px-4 py-2.5 text-start font-medium">
                    {t("fields.branch")}
                  </th>
                  <th className="px-4 py-2.5 text-start font-medium">
                    {t("fields.duration")}
                  </th>
                  <th className="px-4 py-2.5 text-start font-medium">
                    {t("fields.status")}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {authorizations.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {a.service?.name ?? a.service_id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.branch_id
                        ? (branchNameById.get(a.branch_id) ?? a.branch_id)
                        : t("allBranches")}
                    </td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">
                      {a.duration_minutes
                        ? t("durationMinutes", { minutes: a.duration_minutes })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          a.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {a.is_active
                          ? t("status.active")
                          : t("status.inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            toggleActive.mutate({
                              serviceId: a.service_id,
                              active: !a.is_active,
                            })
                          }
                          disabled={toggleActive.isPending}
                          aria-label={t("toggleAria")}
                          title={
                            a.is_active
                              ? t("status.deactivate")
                              : t("status.activate")
                          }
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
                            a.is_active
                              ? "text-emerald-500 hover:bg-emerald-50"
                              : "text-gray-300 hover:bg-gray-100 hover:text-gray-500",
                          )}
                        >
                          <Power className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevokeTarget(a)}
                          aria-label={t("revokeAria")}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {profileId && (
        <AuthorizeServiceDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          profileId={profileId}
          branches={branches}
        />
      )}

      <AlertDialog.Root
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-gray-900">
              {t("revokeConfirm.title")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {t.rich("revokeConfirm.description", {
                name:
                  revokeTarget?.service?.name ??
                  t("revokeConfirm.fallbackName"),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={revoke.isPending}>
                  {tCommon("cancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    if (revokeTarget)
                      revoke.mutate(revokeTarget.service_id, {
                        onSuccess: () => setRevokeTarget(null),
                      });
                  }}
                  disabled={revoke.isPending}
                >
                  {revoke.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      {tCommon("deleting")}
                    </>
                  ) : (
                    t("revokeConfirm.confirm")
                  )}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
