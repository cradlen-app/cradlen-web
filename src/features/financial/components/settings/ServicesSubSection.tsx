"use client";

import { useState } from "react";
import { AlertDialog } from "radix-ui";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { useServices } from "../../hooks/useServices";
import { useDeleteService } from "../../hooks/useDeleteService";
import type { Service } from "../../types/financial.types";
import { ServiceDrawer } from "./ServiceDrawer";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SERVICE_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  PROCEDURE: "Procedure",
  LAB_TEST: "Lab Test",
  IMAGING: "Imaging",
  ADMINISTRATIVE: "Administrative",
  OTHER: "Other",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  CONSULTATION: "bg-blue-50 text-blue-700",
  PROCEDURE: "bg-purple-50 text-purple-700",
  LAB_TEST: "bg-emerald-50 text-emerald-700",
  IMAGING: "bg-orange-50 text-orange-700",
  ADMINISTRATIVE: "bg-gray-100 text-gray-600",
  OTHER: "bg-gray-100 text-gray-500",
};

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <AlertDialog.Title className="text-lg font-medium text-gray-900">
            Delete Service?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete{" "}
            <strong>{service?.name}</strong>? This action cannot be undone.
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

export function ServicesSubSection() {
  const { services, isLoading } = useServices();
  const deleteMutation = useDeleteService();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  function openCreate() {
    setSelectedService(undefined);
    setDrawerMode("create");
    setDrawerOpen(true);
  }

  function openEdit(service: Service) {
    setSelectedService(service);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">Services</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage the clinical services offered by your organization.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          New Service
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            Loading services…
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">No services yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Click &ldquo;+ New Service&rdquo; to add one.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-2.5 text-left font-medium">Code</th>
                <th className="px-4 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Specialties</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {service.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {service.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        SERVICE_TYPE_COLORS[service.service_type] ??
                          "bg-gray-100 text-gray-500",
                      )}
                    >
                      {SERVICE_TYPE_LABELS[service.service_type] ??
                        service.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {service.specialty_ids && service.specialty_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {service.specialty_ids.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-600"
                            title={id}
                          >
                            {id.slice(0, 8)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        aria-label="Edit service"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(service)}
                        aria-label="Delete service"
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
      <ServiceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        service={selectedService}
      />

      <DeleteServiceDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        service={deleteTarget}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
