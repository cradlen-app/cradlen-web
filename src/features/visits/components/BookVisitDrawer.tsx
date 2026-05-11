"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useBookVisit } from "../hooks/useBookVisit";
import { usePatientSearch } from "../hooks/usePatientSearch";
import { searchPatients } from "../lib/visits.api";
import { mapApiPatientToPatient, pruneEmpty } from "../lib/visits.utils";
import {
  makeBookVisitSchema,
  getDefaultBookVisitValues,
  parseVitalNumber,
  type BookVisitFormValues,
} from "../lib/visits.schemas";
import { VISIT_TYPE, VISIT_PRIORITY } from "../lib/visits.constants";
import type {
  ApiVisitType,
  ApiVisitPriority,
  BookVisitRequest,
  ChiefComplaintMeta,
  VitalsInput,
} from "../types/visits.api.types";
import type { Patient } from "../types/visits.types";
import { BookVisitPatientSearch } from "./BookVisitPatientSearch";
import { BookVisitMetaSection } from "./BookVisitMetaSection";
import { BookVisitPersonalInfoSection } from "./BookVisitPersonalInfoSection";
import { BookVisitIntakeSection } from "./BookVisitIntakeSection";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
  branchName?: string;
};

export function BookVisitDrawer({
  open,
  onOpenChange,
  branchId,
  organizationId,
  branchName,
}: Props) {
  const t = useTranslations("visits");

  const typeOptions: Array<{ value: ApiVisitType; label: string }> = [
    { value: VISIT_TYPE.VISIT, label: t("type.visit") },
    { value: VISIT_TYPE.FOLLOW_UP, label: t("type.followUp") },
    { value: VISIT_TYPE.MEDICAL_REP, label: t("type.medicalRep") },
  ];

  const priorityOptions: Array<{ value: ApiVisitPriority; label: string }> = [
    { value: VISIT_PRIORITY.NORMAL, label: t("priority.normal") },
    { value: VISIT_PRIORITY.EMERGENCY, label: t("priority.emergency") },
  ];

  const bookVisit = useBookVisit();
  const { data: staffList = [] } = useStaff(
    organizationId ?? undefined,
    undefined,
    { branchId: branchId ?? undefined },
  );
  const doctors = useMemo(
    () => staffList.filter((member) => member.isClinical),
    [staffList],
  );

  const [searchInput, setSearchInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<Patient | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const { data: searchResults = [], isFetching: isSearching } = usePatientSearch(searchInput);

  const schema = useMemo(() => makeBookVisitSchema(t), [t]);

  const form = useForm<BookVisitFormValues>({
    defaultValues: getDefaultBookVisitValues(),
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    control,
  } = form;

  const visitType = useWatch({ control, name: "visitType" });
  const priority = useWatch({ control, name: "priority" });
  const isMarried = useWatch({ control, name: "isMarried" });
  const patientMode = useWatch({ control, name: "patientMode" });
  const assignedDoctorId = useWatch({ control, name: "assignedDoctorId" });

  // Auto-select the first available doctor once the list resolves, unless the
  // user has already picked one.
  useEffect(() => {
    if (!assignedDoctorId && doctors.length > 0) {
      setValue("assignedDoctorId", doctors[0].id, { shouldDirty: false });
    }
  }, [doctors, assignedDoctorId, setValue]);

  const selectedDoctor = doctors.find((d) => d.id === assignedDoctorId);
  const doctorHint =
    selectedDoctor?.specialties?.map((s) => s.name).join(", ") ||
    selectedDoctor?.jobFunctions?.map((j) => j.name).join(", ") ||
    null;

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

  function buildIntake(values: BookVisitFormValues) {
    const meta = pruneEmpty<ChiefComplaintMeta>({
      categories: values.chiefComplaintCategories?.length
        ? values.chiefComplaintCategories
        : undefined,
      onset: values.chiefComplaintOnset,
      duration: values.chiefComplaintDuration,
      severity: values.chiefComplaintSeverity,
    });
    const vitals = pruneEmpty<VitalsInput>({
      systolic_bp: parseVitalNumber(values.vitalsSystolicBp),
      diastolic_bp: parseVitalNumber(values.vitalsDiastolicBp),
      pulse: parseVitalNumber(values.vitalsPulse),
      temperature_c: parseVitalNumber(values.vitalsTemperatureC),
      respiratory_rate: parseVitalNumber(values.vitalsRespiratoryRate),
      spo2: parseVitalNumber(values.vitalsSpo2),
      weight_kg: parseVitalNumber(values.vitalsWeightKg),
      height_cm: parseVitalNumber(values.vitalsHeightCm),
    });
    return pruneEmpty({
      chief_complaint: values.chiefComplaint?.trim() || undefined,
      chief_complaint_meta: meta,
      vitals,
    });
  }

  async function resolveDuplicate(nationalId?: string) {
    if (!nationalId) return null;
    try {
      const res = await searchPatients(nationalId);
      const matches = res.data.map(mapApiPatientToPatient);
      const exact = matches.find((p) => p.nationalId === nationalId);
      return exact ?? (matches.length === 1 ? matches[0] : null);
    } catch {
      return null;
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!branchId) {
      toast.error(t("create.errorNoBranch"));
      return;
    }
    setDuplicateMatch(null);
    setDuplicateError(null);

    let body: BookVisitRequest;

    const scheduledRaw = values.scheduledAt?.trim();
    const scheduledDate = scheduledRaw ? new Date(scheduledRaw) : new Date();
    const scheduledAt = Number.isNaN(scheduledDate.getTime())
      ? new Date().toISOString()
      : scheduledDate.toISOString();
    const isMedicalRep = values.visitType === VISIT_TYPE.MEDICAL_REP;
    const intake = buildIntake(values) ?? {};

    if (values.patientMode === "existing" && values.patientId) {
      body = {
        ...intake,
        patient_id: values.patientId,
        assigned_doctor_id: values.assignedDoctorId,
        visit_type: values.visitType,
        priority: values.priority,
        scheduled_at: scheduledAt,
        branch_id: branchId,
      };
    } else {
      body = {
        ...intake,
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
        branch_id: branchId,
      };
    }

    try {
      await bookVisit.mutateAsync(body);
      toast.success(t("create.successMessage"));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const match = await resolveDuplicate(values.nationalId?.trim());
        if (match) {
          setDuplicateMatch(match);
        } else {
          setDuplicateError(t("create.errors.nationalIdExists"));
        }
        return;
      }
      const message = error instanceof ApiError ? error.messages[0] : t("create.errorGeneric");
      toast.error(message);
    }
  });

  function handleUseExistingPatient() {
    if (duplicateMatch) {
      handleSelectPatient(duplicateMatch);
      setDuplicateMatch(null);
    }
  }

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
              {t("create.title")}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {t("create.description")}
            </Dialog.Description>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Patient search */}
          <BookVisitPatientSearch
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            searchResults={searchResults}
            isSearching={isSearching}
            dropdownOpen={dropdownOpen}
            onDropdownOpenChange={setDropdownOpen}
            selectedPatient={selectedPatient}
            onSelectPatient={handleSelectPatient}
            onClearSearch={handleClearSearch}
          />

          <FormProvider {...form}>
            <form onSubmit={onSubmit} className="mt-5 flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">

              {/* Duplicate national_id alert */}
              {(duplicateMatch || duplicateError) && (
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-800">
                  <p className="font-medium">{t("create.errors.nationalIdExists")}</p>
                  {duplicateMatch ? (
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-amber-700">
                        {duplicateMatch.fullName}
                        {duplicateMatch.nationalId ? ` · ${duplicateMatch.nationalId}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={handleUseExistingPatient}
                        className="inline-flex h-7 items-center rounded-full bg-brand-primary px-3 text-[11px] font-semibold text-white hover:bg-brand-primary/90"
                      >
                        {t("create.errors.useExistingPatient")}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-amber-700">
                      {t("create.errors.searchPatientsHint")}
                    </p>
                  )}
                </div>
              )}

              {/* Visit Meta */}
              <BookVisitMetaSection
                register={register}
                errors={errors}
                setValue={setValue}
                visitType={visitType}
                priority={priority}
                typeOptions={typeOptions}
                priorityOptions={priorityOptions}
                doctors={doctors}
                doctorHint={doctorHint}
              />

              {/* Personal Information */}
              <BookVisitPersonalInfoSection
                register={register}
                errors={errors}
                patientMode={patientMode}
                visitType={visitType}
                isMarried={isMarried}
              />

              {/* Clinical intake (optional, collapsible) */}
              <section className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIntakeOpen((v) => !v)}
                  aria-expanded={intakeOpen}
                  className="flex w-full items-center gap-4 text-start"
                >
                  <p className="shrink-0 text-xs font-medium text-gray-400">
                    {t("create.intake.title")}
                  </p>
                  <span className="h-px flex-1 bg-gray-200" />
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-gray-400 transition-transform",
                      intakeOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                {intakeOpen && <BookVisitIntakeSection />}
              </section>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              {branchName && (
                <span className="me-auto text-[11px] text-gray-400">
                  {t("create.branchLabel", { branch: branchName })}
                </span>
              )}
              <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50">
                {t("create.cancelButton")}
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
                    {t("create.submitting")}
                  </>
                ) : (
                  t("create.submitButton")
                )}
              </button>
            </div>
            </form>
          </FormProvider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
