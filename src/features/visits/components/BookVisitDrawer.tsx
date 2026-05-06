"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search, Stethoscope, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useBookVisit } from "../hooks/useBookVisit";
import { usePatientSearch } from "../hooks/usePatientSearch";
import {
  bookVisitSchema,
  getDefaultBookVisitValues,
  type BookVisitFormValues,
} from "../lib/visits.schemas";
import type {
  ApiVisitPriority,
  ApiVisitType,
  BookVisitRequest,
} from "../types/visits.api.types";
import type { Patient } from "../types/visits.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
  branchName?: string;
};

const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0";

const TYPE_OPTIONS: Array<{ value: ApiVisitType; label: string }> = [
  { value: "VISIT", label: "Visit" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "MEDICAL_REP", label: "Medical Rep" },
];

const PRIORITY_OPTIONS: Array<{ value: ApiVisitPriority; label: string }> = [
  { value: "NORMAL", label: "Normal" },
  { value: "EMERGENCY", label: "Emergency" },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <p className="shrink-0 text-xs font-medium text-gray-400">{title}</p>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="pt-1 text-[11px] text-red-500">{message}</p>;
}

export function BookVisitDrawer({
  open,
  onOpenChange,
  branchId,
  organizationId,
  branchName,
}: Props) {
  const bookVisit = useBookVisit();
  const { data: doctors = [] } = useStaff(
    organizationId ?? undefined,
    undefined,
    { branchId: branchId ?? undefined, role: "DOCTOR" },
  );

  const [searchInput, setSearchInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults = [], isFetching: isSearching } = usePatientSearch(searchInput);

  const form = useForm<BookVisitFormValues>({
    defaultValues: getDefaultBookVisitValues(),
    resolver: zodResolver(bookVisitSchema),
    mode: "onSubmit",
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    control,
    reset,
  } = form;

  const visitType = useWatch({ control, name: "visitType" });
  const priority = useWatch({ control, name: "priority" });
  const isMarried = useWatch({ control, name: "isMarried" });
  const patientMode = useWatch({ control, name: "patientMode" });
  const assignedDoctorId = useWatch({ control, name: "assignedDoctorId" });
  const selectedDoctor = doctors.find((d) => d.id === assignedDoctorId);
  const doctorHint = selectedDoctor?.specialty || selectedDoctor?.jobTitle || null;

  useEffect(() => {
    if (open) {
      reset(getDefaultBookVisitValues());
      setSearchInput("");
      setSelectedPatient(null);
      setDropdownOpen(false);
    }
  }, [open, reset]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setSearchInput(patient.fullName);
    setDropdownOpen(false);
    setValue("patientMode", "existing");
    setValue("patientId", patient.id);
    setValue("fullName", patient.fullName);
    setValue("nationalId", patient.nationalId ?? "");
    setValue("dateOfBirth", patient.dateOfBirth ?? "");
    setValue("phoneNumber", patient.phoneNumber ?? "");
    setValue("address", patient.address ?? "");
    setValue("isMarried", patient.isMarried ?? false);
    setValue("husbandName", patient.husbandName ?? "");
  }

  function handleClearSearch() {
    setSelectedPatient(null);
    setSearchInput("");
    setValue("patientMode", "new");
    setValue("patientId", "");
    setValue("fullName", "");
    setValue("nationalId", "");
    setValue("dateOfBirth", "");
    setValue("phoneNumber", "");
    setValue("address", "");
    setValue("isMarried", false);
    setValue("husbandName", "");
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!branchId) {
      toast.error("No branch is linked to this session.");
      return;
    }

    let body: BookVisitRequest;

    const scheduledAt = values.scheduledAt?.trim() || new Date().toISOString();
    const isMedicalRep = values.visitType === "MEDICAL_REP";

    if (values.patientMode === "existing" && values.patientId) {
      body = {
        patient_id: values.patientId,
        assigned_doctor_id: values.assignedDoctorId,
        visit_type: values.visitType,
        priority: values.priority,
        scheduled_at: scheduledAt,
        notes: values.notes?.trim() || undefined,
        branch_id: branchId,
      };
    } else {
      body = {
        national_id: isMedicalRep ? (values.nationalId ?? "") : values.nationalId!,
        full_name: values.fullName!,
        date_of_birth: isMedicalRep ? (values.dateOfBirth ?? "") : values.dateOfBirth!,
        phone_number: values.phoneNumber!,
        address: values.address?.trim() || undefined,
        is_married: isMedicalRep ? false : (values.isMarried ?? false),
        husband_name: isMedicalRep ? undefined : (values.husbandName?.trim() || undefined),
        assigned_doctor_id: values.assignedDoctorId,
        visit_type: values.visitType,
        priority: values.priority,
        scheduled_at: scheduledAt,
        notes: values.notes?.trim() || undefined,
        branch_id: branchId,
      };
    }

    try {
      await bookVisit.mutateAsync(body);
      toast.success("Visit booked successfully.");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Patient already registered with this national ID.");
      } else {
        const message = error instanceof ApiError ? error.messages[0] : "Failed to book the visit.";
        toast.error(message);
      }
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-107.5 sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-lg font-medium text-brand-black">
              New Visit
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Book a new visit for an existing or new patient.
            </Dialog.Description>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Patient search */}
          <div ref={searchRef} className="relative mt-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              {isSearching ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-gray-400" aria-hidden="true" />
              ) : (
                <Search className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
              )}
              <input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (selectedPatient && e.target.value !== selectedPatient.fullName) {
                    handleClearSearch();
                    setSearchInput(e.target.value);
                  }
                  setDropdownOpen(true);
                }}
                onFocus={() => searchInput.length >= 2 && setDropdownOpen(true)}
                placeholder="Search patient by name, national ID or phone…"
                className="flex-1 bg-transparent text-xs text-brand-black outline-none placeholder:text-gray-300"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="shrink-0 text-gray-400 hover:text-brand-black"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {dropdownOpen && searchInput.length >= 2 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                {searchResults.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto py-1">
                    {searchResults.map((patient) => (
                      <li key={patient.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full px-3 py-2 text-start hover:bg-gray-50"
                        >
                          <p className="text-xs font-medium text-brand-black">{patient.fullName}</p>
                          <p className="text-[11px] text-gray-400">
                            {patient.nationalId}
                            {patient.phoneNumber ? ` · ${patient.phoneNumber}` : ""}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : !isSearching ? (
                  <p className="px-3 py-3 text-xs text-gray-400">
                    Not found — enter details below to register a new patient.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="mt-5 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">

              {/* Visit Meta */}
              <section className="space-y-3">
                <SectionTitle title="Visit Meta" />

                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">Doctor</span>
                    <div className="relative">
                      <Stethoscope
                        className="pointer-events-none absolute inset-s-0 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <select
                        {...register("assignedDoctorId")}
                        className={cn(fieldClass, "ps-5")}
                      >
                        <option value="">Select doctor</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {`${d.firstName} ${d.lastName}`.trim() || d.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <FieldError message={errors.assignedDoctorId?.message} />
                    {doctorHint && (
                      <p className="pt-1 text-[11px] text-gray-400">{doctorHint}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">Scheduled At</span>
                    <input
                      {...register("scheduledAt")}
                      type="datetime-local"
                      className={fieldClass}
                    />
                  </label>

                  <div className="col-span-2">
                    <span className="text-xs font-medium text-brand-black">Visit Type</span>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {TYPE_OPTIONS.map((option) => {
                        const isActive = visitType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setValue("visitType", option.value, { shouldDirty: true })}
                            className={cn(
                              "h-9 rounded-lg border px-2 text-xs font-medium transition-colors",
                              isActive
                                ? "border-brand-primary bg-brand-primary text-white"
                                : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs font-medium text-brand-black">Visit Priority</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {PRIORITY_OPTIONS.map((option) => {
                        const isActive = priority === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setValue("priority", option.value, { shouldDirty: true })}
                            className={cn(
                              "h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
                              isActive
                                ? option.value === "EMERGENCY"
                                  ? "border-red-500 bg-red-50 text-red-600"
                                  : "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </section>

              {/* Personal Information */}
              <section className="space-y-3">
                <SectionTitle title="Personal Information" />

                <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <label className="col-span-2 block">
                    <span className="text-xs font-medium text-brand-black">Name</span>
                    <input
                      {...register("fullName")}
                      readOnly={patientMode === "existing"}
                      className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                      placeholder="Full name"
                    />
                    <FieldError message={errors.fullName?.message} />
                  </label>

                  <label className="col-span-2 block">
                    <span className="text-xs font-medium text-brand-black">Phone</span>
                    <input
                      {...register("phoneNumber")}
                      readOnly={patientMode === "existing"}
                      className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                      type="tel"
                      placeholder="01012345678"
                    />
                    <FieldError message={errors.phoneNumber?.message} />
                  </label>

                  {visitType === "MEDICAL_REP" && (
                    <label className="col-span-2 block">
                      <span className="text-xs font-medium text-brand-black">Company</span>
                      <input
                        {...register("company")}
                        className={fieldClass}
                        placeholder="Company name"
                      />
                    </label>
                  )}

                  {visitType !== "MEDICAL_REP" && (
                    <>
                      <label className="block">
                        <span className="text-xs font-medium text-brand-black">National ID</span>
                        <input
                          {...register("nationalId")}
                          readOnly={patientMode === "existing"}
                          className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                          placeholder="12345678901234"
                        />
                        <FieldError message={errors.nationalId?.message} />
                      </label>

                      <label className="block">
                        <span className="text-xs font-medium text-brand-black">Date of Birth</span>
                        <input
                          {...register("dateOfBirth")}
                          readOnly={patientMode === "existing"}
                          className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                          type="date"
                        />
                        <FieldError message={errors.dateOfBirth?.message} />
                      </label>

                      <label className="col-span-2 block">
                        <span className="text-xs font-medium text-brand-black">Address</span>
                        <input
                          {...register("address")}
                          readOnly={patientMode === "existing"}
                          className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                          placeholder="City, district"
                        />
                      </label>

                      {patientMode !== "existing" && (
                        <label className="col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register("isMarried")}
                            className="size-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                          />
                          <span className="text-xs font-medium text-brand-black">Married</span>
                        </label>
                      )}

                      {isMarried && patientMode !== "existing" && (
                        <label className="col-span-2 block">
                          <span className="text-xs font-medium text-brand-black">Husband Name</span>
                          <input
                            {...register("husbandName")}
                            className={fieldClass}
                            placeholder="Husband's full name"
                          />
                          <FieldError message={errors.husbandName?.message} />
                        </label>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Notes */}
              <section className="space-y-3">
                <SectionTitle title="Notes" />
                <label className="block">
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className={cn(fieldClass, "h-auto resize-none border-b py-2")}
                    placeholder="Optional notes about the visit"
                  />
                  <FieldError message={errors.notes?.message} />
                </label>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              {branchName && (
                <span className="me-auto text-[11px] text-gray-400">
                  Branch: {branchName}
                </span>
              )}
              <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={bookVisit.isPending}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90",
                  "disabled:bg-brand-primary/50",
                )}
              >
                {bookVisit.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Adding…
                  </>
                ) : (
                  "Add to waiting list"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
