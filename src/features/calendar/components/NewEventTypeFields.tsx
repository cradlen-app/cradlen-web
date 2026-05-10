"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import { usePatientSearch } from "@/features/visits/hooks/usePatientSearch";
import { useStaff } from "@/features/staff/hooks/useStaff";
import type { NewEventFormValues } from "../lib/calendar.schemas";

const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-black placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-colors";
const errorClass = "mt-1 text-xs text-red-500";

type BaseProps = {
  register: UseFormRegister<NewEventFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  errors: FieldErrors<NewEventFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
};

// ── Patient search combobox ────────────────────────────────────────────────────

type PatientSearchProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  error?: string;
};

function PatientSearchField({ setValue, error }: PatientSearchProps) {
  const t = useTranslations("calendar");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = usePatientSearch(query);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(patient: { id: string; fullName: string; nationalId?: string; phoneNumber?: string }) {
    setValue("patient_id", patient.id, { shouldValidate: true });
    setSelectedName(patient.fullName);
    setQuery(patient.fullName);
    setOpen(false);
  }

  function handleClear() {
    setValue("patient_id", "", { shouldValidate: false });
    setSelectedName("");
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      <label className={labelClass}>{t("form.patient")} *</label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors",
          "focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10",
        )}
      >
        {isFetching ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-gray-400" aria-hidden />
        ) : (
          <Search className="size-4 shrink-0 text-gray-400" aria-hidden />
        )}
        <input
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            if (selectedName && v !== selectedName) handleClear();
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={t("form.patientPlaceholder")}
          className="flex-1 bg-transparent text-sm text-brand-black outline-none placeholder:text-gray-400"
        />
        {query && (
          <button type="button" onClick={handleClear} className="shrink-0 text-gray-400 hover:text-brand-black">
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto py-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full px-3 py-2 text-start hover:bg-gray-50"
                  >
                    <p className="text-xs font-medium text-brand-black">{p.fullName}</p>
                    <p className="text-[11px] text-gray-400">
                      {p.nationalId}{p.phoneNumber ? ` · ${p.phoneNumber}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isFetching ? (
            <p className="px-3 py-3 text-xs text-gray-400">{t("form.patientNotFound")}</p>
          ) : null}
        </div>
      )}

      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

// ── Surgery fields ─────────────────────────────────────────────────────────────

export function SurgeryFields({ register, control, errors, setValue }: BaseProps) {
  const t = useTranslations("calendar");
  const { organizationId, branchId: activeBranchId, activeProfile } = useUserProfileContext();
  const branches = activeProfile?.branches ?? [];

  const { data: doctors = [] } = useStaff(organizationId, undefined, { role: "DOCTOR" });

  const { fields: participants, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errs = errors as any;

  // Pre-select the active branch on first render
  useEffect(() => {
    if (activeBranchId) {
      setValue("branch_id", activeBranchId, { shouldValidate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  return (
    <div className="space-y-4">

      {/* Branch select */}
      <div>
        <label className={labelClass}>{t("form.branch")} *</label>
        <select
          {...register("branch_id")}
          className={inputClass}
          defaultValue={activeBranchId ?? ""}
        >
          <option value="">{t("form.selectBranch")}</option>
          {branches.map((b) => (
            <option key={b.branch_id ?? b.id} value={b.branch_id ?? b.id}>
              {b.name ?? b.city}
            </option>
          ))}
        </select>
        {errs?.branch_id && <p className={errorClass}>{errs.branch_id.message}</p>}
      </div>

      {/* Patient search */}
      <PatientSearchField setValue={setValue} error={errs?.patient_id?.message} />

      {/* Surgery name + type */}
      <div>
        <label className={labelClass}>{t("form.surgeryName")} *</label>
        <input
          {...register("details.surgery_name")}
          className={inputClass}
          placeholder="e.g. Cholecystectomy"
        />
        {errs?.details?.surgery_name && (
          <p className={errorClass}>{errs.details.surgery_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t("form.surgeryType")}</label>
          <input
            {...register("details.surgery_type")}
            className={inputClass}
            placeholder="e.g. Laparoscopic"
          />
        </div>
        <div>
          <label className={labelClass}>{t("form.operatingRoom")}</label>
          <input
            {...register("details.operating_room")}
            className={inputClass}
            placeholder="e.g. OR-2"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("form.preOpNotes")}</label>
        <textarea
          {...register("details.pre_op_notes")}
          className={cn(inputClass, "min-h-15 resize-y")}
          placeholder="Pre-operative notes..."
        />
      </div>

      {/* Participants */}
      <div>
        <label className={labelClass}>{t("form.primaryDoctor")} *</label>

        {participants.length === 0 && (
          <p className="mb-2 text-xs text-gray-400">{t("form.noParticipants")}</p>
        )}

        <div className="space-y-2">
          {participants.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              {/* Role pill */}
              <Controller
                control={control}
                name={`participants.${idx}.role`}
                render={({ field: roleField }) => (
                  <select
                    {...roleField}
                    className={cn(inputClass, "w-36 shrink-0")}
                  >
                    <option value="PRIMARY_DOCTOR">{t("roles.primaryDoctor")}</option>
                    <option value="ASSISTANT">{t("roles.assistant")}</option>
                  </select>
                )}
              />

              {/* Doctor name select */}
              <select
                {...register(`participants.${idx}.profile_id`)}
                className={cn(inputClass, "flex-1")}
                defaultValue=""
              >
                <option value="">{t("form.selectDoctor")}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {`${d.firstName} ${d.lastName}`.trim() || d.email}
                    {d.specialties?.length ? ` — ${d.specialties.map((s) => s.name).join(", ")}` : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => remove(idx)}
                className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove participant"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append({ profile_id: "", role: "PRIMARY_DOCTOR" })}
        >
          <Plus className="me-1 size-3" aria-hidden />
          {t("form.addParticipant")}
        </Button>

        {errs?.participants?.root && (
          <p className={errorClass}>{errs.participants.root.message}</p>
        )}
      </div>
    </div>
  );
}

// ── Meeting fields ─────────────────────────────────────────────────────────────

export function MeetingFields({ register, control, errors }: BaseProps) {
  const t = useTranslations("calendar");
  const { fields: attendees, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errs = errors as any;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t("form.location")}</label>
          <input
            {...register("details.location")}
            className={inputClass}
            placeholder="e.g. Conference Room A"
          />
        </div>
        <div>
          <label className={labelClass}>{t("form.virtualLink")}</label>
          <input
            {...register("details.virtual_link")}
            className={inputClass}
            placeholder="https://..."
          />
          {errs?.details?.virtual_link && (
            <p className={errorClass}>{errs.details.virtual_link.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("form.agenda")}</label>
        <textarea
          {...register("details.agenda")}
          className={cn(inputClass, "min-h-15 resize-y")}
          placeholder="Meeting agenda..."
        />
      </div>

      <div>
        <label className={labelClass}>{t("form.attendees")}</label>
        <div className="space-y-2">
          {attendees.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                {...register(`participants.${idx}.profile_id`)}
                className={cn(inputClass, "flex-1")}
                placeholder="Profile ID"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove attendee"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append({ profile_id: "", role: "ATTENDEE" })}
        >
          <Plus className="me-1 size-3" aria-hidden />
          {t("form.addAttendee")}
        </Button>
      </div>
    </div>
  );
}

// ── Leave fields ───────────────────────────────────────────────────────────────

export function LeaveFields({ register }: Pick<BaseProps, "register">) {
  const t = useTranslations("calendar");
  return (
    <div>
      <label className={labelClass}>{t("form.reason")}</label>
      <textarea
        {...register("details.reason")}
        className={cn(inputClass, "min-h-15 resize-y")}
        placeholder="Reason for leave..."
      />
    </div>
  );
}

// ── Personal — no extra fields ─────────────────────────────────────────────────

export function PersonalFields() {
  return null;
}
