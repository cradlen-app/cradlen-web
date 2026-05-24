"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useCreateService } from "../../hooks/useCreateService";
import { useUpdateService } from "../../hooks/useUpdateService";
import type { Service } from "../../types/financial.types";

// ── Schema ────────────────────────────────────────────────────────────────────

const serviceFormSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  service_type: z.enum([
    "CONSULTATION",
    "PROCEDURE",
    "LAB_TEST",
    "IMAGING",
    "ADMINISTRATIVE",
    "OTHER",
  ]),
  base_price: z.number().nonnegative("Price must be 0 or more"),
  // TODO: replace with proper MultiSelect when available — currently comma-separated codes
  specialty_codes_raw: z.string().optional(),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  service?: Service;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceDrawer({ open, onOpenChange, mode, service }: Props) {
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      service_type: "CONSULTATION",
      base_price: 0,
      specialty_codes_raw: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && mode === "edit" && service) {
      form.reset({
        code: service.code,
        name: service.name,
        description: service.description ?? "",
        service_type: service.service_type,
        base_price: service.base_price,
        specialty_codes_raw:
          service.specialties?.map((sp) => sp.code).join(", ") ?? "",
        is_active: service.is_active,
      });
    } else if (open && mode === "create") {
      form.reset({
        code: "",
        name: "",
        description: "",
        service_type: "CONSULTATION",
        base_price: 0,
        specialty_codes_raw: "",
        is_active: true,
      });
    }
  }, [open, mode, service, form]);

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = form.handleSubmit((data) => {
    const specialty_codes = data.specialty_codes_raw
      ? data.specialty_codes_raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    if (mode === "create") {
      createMutation.mutate(
        {
          code: data.code,
          name: data.name,
          description: data.description || undefined,
          service_type: data.service_type,
          base_price: data.base_price,
          is_active: data.is_active,
          specialty_codes,
        },
        { onSuccess: handleClose },
      );
    } else if (service) {
      updateMutation.mutate(
        {
          id: service.id,
          payload: {
            name: data.name,
            description: data.description || undefined,
            service_type: data.service_type,
            base_price: data.base_price,
            is_active: data.is_active,
            specialty_codes,
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
                {mode === "create" ? "New Service" : "Edit Service"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {mode === "create"
                  ? "Add a new clinical service to your catalogue."
                  : "Update service details."}
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
              {/* Code — read-only in edit mode */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("code")}
                  type="text"
                  placeholder="e.g. CONSULT_OB"
                  readOnly={mode === "edit"}
                  className={cn(
                    inputClass,
                    mode === "edit" && "bg-gray-50 text-gray-500",
                    form.formState.errors.code && "border-red-400",
                  )}
                />
                {form.formState.errors.code && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("name")}
                  type="text"
                  placeholder="Service name"
                  className={cn(
                    inputClass,
                    form.formState.errors.name && "border-red-400",
                  )}
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Description{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...form.register("description")}
                  rows={3}
                  placeholder="Brief description…"
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              {/* Service type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register("service_type")}
                  className={inputClass}
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="PROCEDURE">Procedure</option>
                  <option value="LAB_TEST">Lab Test</option>
                  <option value="IMAGING">Imaging</option>
                  <option value="ADMINISTRATIVE">Administrative</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Base price */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Base Price (EGP) <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("base_price", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className={cn(
                    inputClass,
                    form.formState.errors.base_price && "border-red-400",
                  )}
                />
                {form.formState.errors.base_price && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.base_price.message}
                  </p>
                )}
              </div>

              {/* Specialties — comma-separated codes */}
              {/* TODO: replace with proper MultiSelect when available */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Specialty Codes{" "}
                  <span className="text-gray-400">
                    (optional, comma-separated)
                  </span>
                </label>
                <input
                  {...form.register("specialty_codes_raw")}
                  type="text"
                  placeholder="e.g. OBGYN, PEDIATRICS"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Enter specialty codes separated by commas.
                </p>
              </div>

              {/* Is active */}
              <div className="flex items-center gap-3">
                <input
                  {...form.register("is_active")}
                  id="service-is-active"
                  type="checkbox"
                  className="size-4 rounded border-gray-300 accent-blue-600"
                />
                <label
                  htmlFor="service-is-active"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </label>
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
                  "Create Service"
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
