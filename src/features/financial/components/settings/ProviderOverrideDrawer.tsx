"use client";

import { useState, useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useCreateProviderOverride } from "../../hooks/useCreateProviderOverride";
import { useUpdateProviderOverride } from "../../hooks/useUpdateProviderOverride";
import { fetchServices } from "../../lib/services.api";
import type { ProviderOverride } from "../../types/financial.types";

// ── Schema ────────────────────────────────────────────────────────────────────

const overrideFormSchema = z.object({
  service_id: z.string().min(1, "Service is required"),
  service_name: z.string().optional(), // display-only
  price: z.number().nonnegative("Price must be 0 or more"),
  notes: z.string().optional(),
});

type OverrideFormValues = z.infer<typeof overrideFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

type ServiceOption = { id: string; name: string; code: string };

// ── Service combobox ──────────────────────────────────────────────────────────

function ServiceComboboxField({
  orgId,
  displayValue,
  onChange,
  error,
}: {
  orgId: string;
  displayValue: string;
  onChange: (id: string, name: string) => void;
  error?: string;
}) {
  const [search, setSearch] = useState(displayValue);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce 300ms — matches InvoiceLineItemsEditor pattern
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const active = { cancelled: false };
    if (!debouncedSearch) {
      Promise.resolve().then(() => {
        if (!active.cancelled) setOptions([]);
      });
      return () => { active.cancelled = true; };
    }
    fetchServices(orgId, { search: debouncedSearch, isActive: true })
      .then((res) => {
        if (!active.cancelled)
          setOptions(
            res.data.map((s) => ({ id: s.id, name: s.name, code: s.code })),
          );
      })
      .catch(() => { if (!active.cancelled) setOptions([]); });
    return () => { active.cancelled = true; };
  }, [debouncedSearch, orgId]);

  function handleSelect(svc: ServiceOption) {
    setSearch(svc.name);
    setShowDropdown(false);
    onChange(svc.id, svc.name);
  }

  // Suppress unused value warning — value is used for form control
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        Service <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search service…"
          className={cn(inputClass, error && "border-red-400")}
        />
        {showDropdown && options.length > 0 && (
          <ul className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {options.map((svc) => (
              <li key={svc.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                  onMouseDown={() => handleSelect(svc)}
                >
                  <span>{svc.name}</span>
                  <span className="ml-2 font-mono text-xs text-gray-400">
                    {svc.code}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  override?: ProviderOverride;
  profileId: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ProviderOverrideDrawer({
  open,
  onOpenChange,
  mode,
  override,
  profileId,
}: Props) {
  const orgId = useAuthContextStore((s) => s.organizationId) ?? "";
  const createMutation = useCreateProviderOverride(profileId);
  const updateMutation = useUpdateProviderOverride(profileId);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideFormSchema),
    defaultValues: {
      service_id: "",
      service_name: "",
      price: 0,
      notes: "",
    },
  });

  // For create mode: tracks the name of the service chosen from the combobox
  const [selectedServiceName, setSelectedServiceName] = useState("");

  useEffect(() => {
    if (open && mode === "edit" && override) {
      form.reset({
        service_id: override.service_id,
        service_name: override.service_name,
        price: override.price,
        notes: override.notes ?? "",
      });
    } else if (open && mode === "create") {
      form.reset({
        service_id: "",
        service_name: "",
        price: 0,
        notes: "",
      });
      Promise.resolve().then(() => setSelectedServiceName(""));
    }
  }, [open, mode, override, form]);

  // Derive displayed service name from props (edit) or combobox selection (create)
  const displayServiceName =
    mode === "edit" ? (override?.service_name ?? "") : selectedServiceName;

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = form.handleSubmit((data) => {
    if (mode === "create") {
      createMutation.mutate(
        {
          service_id: data.service_id,
          price: data.price,
          notes: data.notes || undefined,
        },
        { onSuccess: handleClose },
      );
    } else if (override) {
      updateMutation.mutate(
        {
          id: override.id,
          payload: {
            price: data.price,
            notes: data.notes || undefined,
          },
        },
        { onSuccess: handleClose },
      );
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-51 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {mode === "create"
                  ? "Add Price Override"
                  : "Edit Price Override"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {mode === "create"
                  ? "Set a personal price override for a service."
                  : "Update your price override."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-900"
              onClick={handleClose}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Service combobox — disabled in edit mode */}
              {mode === "create" ? (
                <ServiceComboboxField
                  orgId={orgId}
                  displayValue={displayServiceName}
                  onChange={(id, name) => {
                    form.setValue("service_id", id);
                    form.setValue("service_name", name);
                    setSelectedServiceName(name);
                  }}
                  error={form.formState.errors.service_id?.message}
                />
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Service
                  </label>
                  <input
                    type="text"
                    value={override?.service_name ?? ""}
                    readOnly
                    className={cn(inputClass, "bg-gray-50 text-gray-500")}
                  />
                </div>
              )}

              {/* Price */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Price (EGP) <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("price", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className={cn(
                    inputClass,
                    form.formState.errors.price && "border-red-400",
                  )}
                />
                {form.formState.errors.price && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...form.register("notes")}
                  rows={3}
                  placeholder="Reason for override…"
                  className={cn(inputClass, "resize-none")}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-100 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : mode === "create" ? (
                  "Add Override"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
