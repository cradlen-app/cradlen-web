"use client";

import { useState } from "react";
import { AlertDialog } from "radix-ui";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useStaff } from "@/core/staff/api";

import { useProviderOverrides } from "../../hooks/useProviderOverrides";
import { useDeleteProviderOverride } from "../../hooks/useDeleteProviderOverride";
import type { ProviderOverride } from "../../types/financial.types";
import { ProviderOverrideDrawer } from "./ProviderOverrideDrawer";

/**
 * Owner-facing provider pricing: pick any clinical staff member, then manage
 * their per-service price overrides. Mirrors `MyPricesSubSection` but works
 * across providers rather than only the signed-in user.
 */
export function ProviderPricingSubSection() {
  const t = useTranslations("financial.providerPricing");
  const tMy = useTranslations("financial.myPrices");
  const tCommon = useTranslations("financial.common");
  const orgId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);

  const staffQuery = useStaff(orgId ?? undefined, branchId ?? undefined);
  const providers = (staffQuery.data ?? []).filter((m) => m.isClinical);

  const [profileId, setProfileId] = useState("");
  const { overrides, isLoading } = useProviderOverrides(profileId || undefined);
  const deleteMutation = useDeleteProviderOverride(profileId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<ProviderOverride | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ProviderOverride | null>(null);

  function openCreate() {
    setSelected(undefined);
    setDrawerMode("create");
    setDrawerOpen(true);
  }
  function openEdit(o: ProviderOverride) {
    setSelected(o);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }

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
            onClick={openCreate}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {tMy("addOverride")}
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
              {tMy("loading")}
            </div>
          ) : overrides.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-gray-700">
                {tMy("noOverridesYet")}
              </p>
              <p className="mt-1 text-sm text-gray-400">{tMy("clickAddOverride")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2.5 text-start font-medium">
                    {tMy("fields.service")}
                  </th>
                  <th className="px-4 py-2.5 text-start font-medium">
                    {tMy("fields.price")}
                  </th>
                  <th className="px-4 py-2.5 text-start font-medium">{tMy("valid")}</th>
                  <th className="px-4 py-2.5 text-end font-medium">{tMy("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {o.service?.name ?? o.service_id}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {o.currency}{" "}
                      {o.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {o.valid_from || o.valid_to
                        ? `${o.valid_from?.slice(0, 10) ?? "—"} → ${o.valid_to?.slice(0, 10) ?? "—"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(o)}
                          aria-label={tMy("editAria")}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(o)}
                          aria-label={tMy("deleteAria")}
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
        <ProviderOverrideDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          mode={drawerMode}
          override={selected}
          profileId={profileId}
        />
      )}

      <AlertDialog.Root
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-gray-900">
              {tMy("deleteConfirm.title")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {tMy.rich("deleteConfirm.description", {
                name: deleteTarget?.service?.name ?? tMy("deleteConfirm.fallbackName"),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
                  {tCommon("cancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    if (deleteTarget)
                      deleteMutation.mutate(deleteTarget.id, {
                        onSuccess: () => setDeleteTarget(null),
                      });
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      {tCommon("deleting")}
                    </>
                  ) : (
                    tMy("deleteConfirm.confirm")
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
