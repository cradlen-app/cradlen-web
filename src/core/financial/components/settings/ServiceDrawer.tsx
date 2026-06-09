"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useCreateService } from "../../hooks/useCreateService";
import { useUpdateService } from "../../hooks/useUpdateService";
import type { Service } from "../../types/financial.types";
import { OrgSpecialtiesSelect } from "./OrgSpecialtiesSelect";

// ── Schema ────────────────────────────────────────────────────────────────────

const serviceFormSchema = z.object({
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
  // Backend expects an array of specialty UUIDs (`specialty_ids`).
  specialty_ids: z.array(z.string()).optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Auto-generates a unique service code from the name. Slugifies the name to
 * uppercase alphanumerics and appends a short random suffix so concurrent
 * services with the same name don't collide on the backend's unique code.
 */
function generateServiceCode(name: string): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return slug ? `${slug}-${suffix}` : `SVC-${suffix}`;
}

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
  const t = useTranslations("financial.services");
  const tCommon = useTranslations("financial.common");
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const organizationId = useAuthContextStore((s) => s.organizationId);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      service_type: "CONSULTATION",
      specialty_ids: [],
    },
  });

  useEffect(() => {
    if (open && mode === "edit" && service) {
      form.reset({
        name: service.name,
        description: service.description ?? "",
        service_type: service.service_type,
        specialty_ids: service.specialty_ids ?? [],
      });
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        description: "",
        service_type: "CONSULTATION",
        specialty_ids: [],
      });
    }
  }, [open, mode, service, form]);

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = form.handleSubmit((data) => {
    const specialty_ids = data.specialty_ids?.length
      ? data.specialty_ids
      : undefined;

    if (mode === "create") {
      createMutation.mutate(
        {
          code: generateServiceCode(data.name),
          name: data.name,
          description: data.description || undefined,
          service_type: data.service_type,
          specialty_ids,
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
            specialty_ids,
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
                {mode === "create" ? t("newService") : t("editService")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {mode === "create"
                  ? t("newServiceDescription")
                  : t("editServiceDescription")}
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
              {/* Code — auto-generated; shown read-only when editing */}
              {mode === "edit" && service && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("fields.code")}
                  </label>
                  <input
                    type="text"
                    value={service.code}
                    readOnly
                    className={cn(inputClass, "bg-gray-50 text-gray-500")}
                  />
                </div>
              )}

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("name")}
                  type="text"
                  placeholder={t("fields.namePlaceholder")}
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
                  {t("fields.description")}{" "}
                  <span className="text-gray-400">{tCommon("optional")}</span>
                </label>
                <textarea
                  {...form.register("description")}
                  rows={3}
                  placeholder={t("fields.descriptionPlaceholder")}
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              {/* Service type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.type")} <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register("service_type")}
                  className={inputClass}
                >
                  <option value="CONSULTATION">{t("type.CONSULTATION")}</option>
                  <option value="PROCEDURE">{t("type.PROCEDURE")}</option>
                  <option value="LAB_TEST">{t("type.LAB_TEST")}</option>
                  <option value="IMAGING">{t("type.IMAGING")}</option>
                  <option value="ADMINISTRATIVE">{t("type.ADMINISTRATIVE")}</option>
                  <option value="OTHER">{t("type.OTHER")}</option>
                </select>
              </div>

              {/* Specialties — org specialty multi-select (stores UUIDs) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.specialties")}{" "}
                  <span className="text-gray-400">{tCommon("optional")}</span>
                </label>
                <Controller
                  control={form.control}
                  name="specialty_ids"
                  render={({ field }) => (
                    <OrgSpecialtiesSelect
                      organizationId={organizationId}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder={t("fields.specialtyIdsPlaceholder")}
                    />
                  )}
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
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {tCommon("saving")}
                  </>
                ) : mode === "create" ? (
                  t("createService")
                ) : (
                  tCommon("saveChanges")
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
