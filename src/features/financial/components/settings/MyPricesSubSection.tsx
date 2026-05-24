"use client";

import { useState } from "react";
import { AlertDialog } from "radix-ui";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useProviderOverrides } from "../../hooks/useProviderOverrides";
import { useDeleteProviderOverride } from "../../hooks/useDeleteProviderOverride";
import type { ProviderOverride } from "../../types/financial.types";
import { ProviderOverrideDrawer } from "./ProviderOverrideDrawer";

// ── Delete dialog ─────────────────────────────────────────────────────────────

function DeleteOverrideDialog({
  open,
  onOpenChange,
  override,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  override: ProviderOverride | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <AlertDialog.Title className="text-lg font-medium text-gray-900">
            Delete Price Override?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-500">
            Are you sure you want to remove the override for{" "}
            <strong>{override?.service_name}</strong>? The org price list rate
            will apply instead.
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MyPricesSubSection() {
  const profileId = useAuthContextStore((s) => s.profileId);
  const { overrides, isLoading } = useProviderOverrides(profileId);
  const deleteMutation = useDeleteProviderOverride(profileId ?? "");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedOverride, setSelectedOverride] = useState<
    ProviderOverride | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<ProviderOverride | null>(
    null,
  );

  function openCreate() {
    setSelectedOverride(undefined);
    setDrawerMode("create");
    setDrawerOpen(true);
  }

  function openEdit(override: ProviderOverride) {
    setSelectedOverride(override);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  if (!profileId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
        <p className="text-sm text-gray-400">Profile not available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            My Price Overrides
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Set personal price overrides for services you provide. These take
            priority over the org price list.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          Add Override
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : overrides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">
              No price overrides yet
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Click &ldquo;+ Add Override&rdquo; to add one.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-2.5 text-left font-medium">Service</th>
                <th className="px-4 py-2.5 text-left font-medium">Price</th>
                <th className="px-4 py-2.5 text-left font-medium">Notes</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((override) => (
                <tr
                  key={override.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {override.service_name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    EGP{" "}
                    {override.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {override.notes ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(override)}
                        aria-label="Edit override"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(override)}
                        aria-label="Delete override"
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

      {/* Drawers & Dialogs */}
      <ProviderOverrideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        override={selectedOverride}
        profileId={profileId}
      />

      <DeleteOverrideDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        override={deleteTarget}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
