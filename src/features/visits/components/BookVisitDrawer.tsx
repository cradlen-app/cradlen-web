"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
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
import { VISIT_TYPE, VISIT_PRIORITY } from "../lib/visits.constants";
import type {
  ApiVisitType,
  ApiVisitPriority,
  BookVisitRequest,
} from "../types/visits.api.types";
import type { Patient } from "../types/visits.types";
import { BookVisitPatientSearch } from "./BookVisitPatientSearch";
import { BookVisitMetaSection } from "./BookVisitMetaSection";
import { BookVisitPersonalInfoSection } from "./BookVisitPersonalInfoSection";
import { fieldClass, SectionTitle, FieldError } from "./book-visit-shared";

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
  const { data: doctors = [] } = useStaff(
    organizationId ?? undefined,
    undefined,
    { branchId: branchId ?? undefined, role: "DOCTOR" },
  );

  const [searchInput, setSearchInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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
      toast.error(t("create.errorNoBranch"));
      return;
    }

    let body: BookVisitRequest;

    const scheduledAt = values.scheduledAt?.trim() || new Date().toISOString();
    const isMedicalRep = values.visitType === VISIT_TYPE.MEDICAL_REP;

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
      toast.success(t("create.successMessage"));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t("create.errorDuplicatePatient"));
      } else {
        const message = error instanceof ApiError ? error.messages[0] : t("create.errorGeneric");
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

          <form onSubmit={onSubmit} className="mt-5 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">

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

              {/* Notes */}
              <section className="space-y-3">
                <SectionTitle title={t("create.sectionNotes")} />
                <label className="block">
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className={cn(fieldClass, "h-auto resize-none border-b py-2")}
                    placeholder={t("create.fields.notesPlaceholder")}
                  />
                  <FieldError message={errors.notes?.message} />
                </label>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
