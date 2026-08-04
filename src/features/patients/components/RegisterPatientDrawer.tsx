"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { useRouter } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { mapVisitApiError } from "@/features/visits/lib/mapVisitApiError";
import { fetchPatientIdentity } from "@/features/visits/lib/visits.api";
import { QuickStartVisitDialog } from "@/features/visits/components/QuickStartVisitDialog";
import type { ApiPatient } from "@/features/visits/types/visits.api.types";
import { useRegisterPatient } from "../hooks/useRegisterPatient";
import type { RegisterPatientRequest } from "../lib/patients.api";
import { PatientSearchField } from "./PatientSearchField";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

const NATIONAL_ID_PATTERN = /^[0-9]{8,20}$/;

const MARITAL_STATUSES = [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "ENGAGED",
  "UNKNOWN",
] as const;

/** ISO datetime → yyyy-mm-dd for a native date input. */
function toDateInput(value?: string): string {
  return value ? value.slice(0, 10) : "";
}

/**
 * Registers a patient into the org, with an optional hand-off straight into a
 * visit.
 *
 * Both actions POST the same registration; they differ only in what happens
 * afterwards. "Save & start visit" chains into the existing
 * `QuickStartVisitDialog`, which self-resolves doctor, branch, specialty and
 * services from context and needs only the new patient's id and name. Two
 * requests rather than one, deliberately: the partial-failure window lands the
 * right way round (patient saved, visit not started, retryable) and the service
 * picker stays out of an intake form.
 */
export function RegisterPatientDrawer({ open, onOpenChange }: Props) {
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
          {/* Mounted only while open, so state resets per open with no effect. */}
          <RegisterForm onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RegisterForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("patients.register");
  const tCreate = useTranslations("visits.create");
  const router = useRouter();
  const dashboardPath = useDashboardPath();
  const register = useRegisterPatient();

  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [maritalStatus, setMaritalStatus] =
    useState<ApiPatient["marital_status"]>("UNKNOWN");

  /**
   * Set when an existing patient was picked from the cross-org search. Switches
   * the payload to the link shape and locks the identity key — mirroring the
   * booking template's `lockFilledFields: ['national_id']`.
   */
  const [linkedPatientId, setLinkedPatientId] = useState<string | null>(null);

  /** The patient created/linked by "Save & start visit", awaiting the dialog. */
  const [startedPatient, setStartedPatient] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const linked = linkedPatientId !== null;

  async function handleSelectExisting(patientId: string) {
    setLinkedPatientId(patientId);
    try {
      // Full identity is revealed per-record, on explicit selection — the
      // search rows carry only a name and the last 3 phone digits.
      const patient = await fetchPatientIdentity(patientId);
      setFullName(patient.full_name ?? "");
      setNationalId(patient.national_id ?? "");
      setDateOfBirth(toDateInput(patient.date_of_birth));
      setPhone(patient.phone_number ?? "");
      setAddress(patient.address ?? "");
      setMaritalStatus(patient.marital_status ?? "UNKNOWN");
    } catch {
      // The reveal is throttled and can legitimately fail. Keep the link — the
      // id is all the payload needs — and just skip the prefill.
      toast.error(t("identityRevealFailed"));
    }
  }

  function handleClearLink() {
    setLinkedPatientId(null);
    setNationalId("");
    setDateOfBirth("");
    setPhone("");
    setAddress("");
    setMaritalStatus("UNKNOWN");
  }

  function buildPayload(): RegisterPatientRequest | null {
    if (linkedPatientId) {
      return { patient_id: linkedPatientId, marital_status: maritalStatus };
    }
    if (!fullName.trim()) {
      toast.error(t("errorFullNameRequired"));
      return null;
    }
    if (!NATIONAL_ID_PATTERN.test(nationalId.trim())) {
      toast.error(t("errorNationalIdInvalid"));
      return null;
    }
    if (!dateOfBirth) {
      toast.error(t("errorDateOfBirthRequired"));
      return null;
    }
    if (!phone.trim()) {
      toast.error(t("errorPhoneRequired"));
      return null;
    }
    if (!address.trim()) {
      toast.error(t("errorAddressRequired"));
      return null;
    }
    return {
      full_name: fullName.trim(),
      national_id: nationalId.trim(),
      date_of_birth: dateOfBirth,
      phone_number: phone.trim(),
      address: address.trim(),
      marital_status: maritalStatus,
    };
  }

  function handleError(error: unknown) {
    const mapped = mapVisitApiError(error);

    if (mapped.kind === "duplicatePatient") {
      const { patientId } = mapped;
      toast.error(tCreate("errorDuplicatePatient"), {
        description: tCreate("errors.useExistingPatient"),
        // `Patient` is global — the colliding record may belong to another
        // clinic and 404 for this caller, so only offer the jump when the API
        // actually named it.
        ...(patientId
          ? {
              action: {
                label: t("openExistingPatient"),
                onClick: () =>
                  router.push(dashboardPath(`/patients/${patientId}`)),
              },
            }
          : {}),
      });
      return;
    }
    if (mapped.kind === "toastMessage") {
      toast.error(mapped.message);
      return;
    }
    if (mapped.kind === "fields") {
      toast.error(Object.values(mapped.fieldErrors).join(", "));
      return;
    }
    toast.error(t("errorGeneric"));
  }

  async function submit(thenStartVisit: boolean) {
    const payload = buildPayload();
    if (!payload) return;

    try {
      const res = await register.mutateAsync(payload);
      const patient = res.data.patient;
      toast.success(t("successToast"));

      if (thenStartVisit) {
        // Keep the drawer mounted underneath: the quick-start dialog owns the
        // next step and closing both is its job on success.
        setStartedPatient({ id: patient.id, name: patient.full_name });
        return;
      }
      onClose();
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Dialog.Title className="text-base font-semibold text-brand-black">
            {t("title")}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-gray-500">
            {t("description")}
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label={t("cancel")}
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <X className="size-4" aria-hidden="true" />
        </Dialog.Close>
      </div>

      <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pe-1">
        <div className="space-y-1.5">
          <label htmlFor="register-full-name" className="text-xs font-medium text-gray-600">
            {t("fullName")}
          </label>
          <PatientSearchField
            id="register-full-name"
            value={fullName}
            onChange={setFullName}
            onSelect={handleSelectExisting}
            onClear={handleClearLink}
            linked={linked}
            inputClass={inputClass}
          />
          <p className="text-[11px] text-gray-400">
            {linked ? t("linkedNotice") : t("searchHint")}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-national-id" className="text-xs font-medium text-gray-600">
            {t("nationalId")}
          </label>
          <input
            id="register-national-id"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            // Locked once linked: correcting a national id is a manager-only
            // action on PATCH /patients/:id, not part of registration.
            disabled={linked}
            inputMode="numeric"
            className={cn(inputClass, linked && "bg-gray-50 text-gray-500")}
          />
          {linked && (
            <p className="text-[11px] text-gray-400">{t("nationalIdLocked")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-dob" className="text-xs font-medium text-gray-600">
            {t("dateOfBirth")}
          </label>
          <input
            id="register-dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            disabled={linked}
            className={cn(inputClass, linked && "bg-gray-50 text-gray-500")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-phone" className="text-xs font-medium text-gray-600">
            {t("phoneNumber")}
          </label>
          <input
            id="register-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={linked}
            inputMode="tel"
            className={cn(inputClass, linked && "bg-gray-50 text-gray-500")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-address" className="text-xs font-medium text-gray-600">
            {t("address")}
          </label>
          <input
            id="register-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={linked}
            className={cn(inputClass, linked && "bg-gray-50 text-gray-500")}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-marital" className="text-xs font-medium text-gray-600">
            {t("maritalStatus")}
          </label>
          <select
            id="register-marital"
            value={maritalStatus}
            onChange={(e) =>
              setMaritalStatus(e.target.value as ApiPatient["marital_status"])
            }
            className={inputClass}
          >
            {MARITAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`marital.${status}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={register.isPending}
          onClick={() => submit(false)}
        >
          {register.isPending ? t("saving") : t("save")}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={register.isPending}
          onClick={() => submit(true)}
        >
          <Play className="size-4" aria-hidden="true" />
          {t("saveAndStart")}
        </Button>
      </div>

      {startedPatient && (
        <QuickStartVisitDialog
          open
          onOpenChange={(next) => {
            if (next) return;
            // The quick-start dialog closed — either it booked and navigated
            // away, or the doctor backed out. The patient is registered either
            // way, so the drawer's work is done.
            setStartedPatient(null);
            onClose();
          }}
          patientId={startedPatient.id}
          patientName={startedPatient.name}
        />
      )}
    </>
  );
}
