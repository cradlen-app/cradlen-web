"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import type { ApiPatient } from "@/features/visits/types/visits.api.types";
import { useUpdatePatient } from "../../hooks/useUpdatePatient";

type Props = {
  patient: ApiPatient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** ISO datetime → yyyy-mm-dd for a native date input. */
function toDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

/**
 * Inner form. Lives inside `Dialog.Content`, which radix mounts only while
 * open — so `useState` initializes from the patient each time the drawer
 * opens, with no reset effect.
 */
function ProfileForm({
  patient,
  onClose,
}: {
  patient: ApiPatient;
  onClose: () => void;
}) {
  const t = useTranslations("patients.profile");
  const updatePatient = useUpdatePatient();

  const [fullName, setFullName] = useState(patient.full_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(toDateInput(patient.date_of_birth));
  const [phone, setPhone] = useState(patient.phone_number ?? "");
  const [address, setAddress] = useState(patient.address ?? "");
  // National ID is a sensitive, globally-unique identity key. It stays locked
  // until the user explicitly confirms an intent to correct it.
  const [nationalId, setNationalId] = useState(patient.national_id ?? "");
  const [idConfirming, setIdConfirming] = useState(false);
  const [idUnlocked, setIdUnlocked] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error(t("fullNameRequired"));
      return;
    }
    // Only correct the national id when the user unlocked it AND actually
    // changed it. Validate the digits/length the backend enforces.
    const trimmedId = nationalId.trim();
    const idChanged = idUnlocked && trimmedId !== (patient.national_id ?? "");
    if (idChanged && !/^[0-9]{8,20}$/.test(trimmedId)) {
      toast.error(t("nationalIdInvalid"));
      return;
    }
    try {
      await updatePatient.mutateAsync({
        id: patient.id,
        data: {
          full_name: fullName.trim(),
          ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}),
          phone_number: phone.trim(),
          address: address.trim(),
          ...(idChanged ? { national_id: trimmedId } : {}),
        },
      });
      toast.success(t("success"));
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError ? (error.messages[0] ?? t("error")) : t("error");
      toast.error(message);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Dialog.Title className="text-lg font-medium text-brand-black">
          {t("title")}
        </Dialog.Title>
        <Dialog.Description className="sr-only">{t("description")}</Dialog.Description>
        <Dialog.Close
          className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
          aria-label={t("cancel")}
        >
          <X className="size-5" aria-hidden="true" />
        </Dialog.Close>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pe-1">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-500">{t("fullName")}</span>
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
            />
          </label>

          <div className="block space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-500">{t("nationalId")}</span>
              {!idUnlocked && !idConfirming && (
                <button
                  type="button"
                  onClick={() => setIdConfirming(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-primary hover:underline"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  {t("nationalIdEdit")}
                </button>
              )}
            </div>
            <input
              className={cn(
                inputClass,
                !idUnlocked && "cursor-not-allowed bg-gray-50 text-gray-400",
              )}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              readOnly={!idUnlocked}
              disabled={!idUnlocked}
              inputMode="numeric"
            />
            {idConfirming ? (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-[11px] leading-relaxed text-amber-700">
                  {t("nationalIdEditWarning")}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIdConfirming(false)}
                  >
                    {t("nationalIdEditCancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setIdConfirming(false);
                      setIdUnlocked(true);
                    }}
                  >
                    {t("nationalIdEditConfirm")}
                  </Button>
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-gray-400">{t("nationalIdReadonly")}</span>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-500">{t("dateOfBirth")}</span>
            <input
              type="date"
              className={inputClass}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-500">{t("phoneNumber")}</span>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-500">{t("address")}</span>
            <input
              className={inputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Dialog.Close asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </Dialog.Close>
          <Button type="submit" disabled={updatePatient.isPending}>
            {updatePatient.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </>
  );
}

export function PatientProfileDrawer({ patient, open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-100 sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          <ProfileForm patient={patient} onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
