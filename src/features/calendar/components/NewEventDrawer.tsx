"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, Lock, Building2, Globe } from "lucide-react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import { isOwner } from "@/features/auth/lib/permissions";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useCreateCalendarEvent } from "../hooks/useCreateCalendarEvent";
import { useUpdateCalendarEvent } from "../hooks/useUpdateCalendarEvent";
import { type NewEventFormValues } from "../lib/calendar.schemas";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarVisibility,
} from "../types/calendar.types";
import { ProcedureFields } from "./NewEventTypeFields";
import {
  buildCreateRequest,
  buildUpdateRequest,
  computeAudience,
  defaultValuesForType,
  schemaForType,
  valuesFromEvent,
  type Audience,
} from "./new-event.helpers";
import { AudienceOption, TypePicker } from "./new-event-pickers";

const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-black placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-colors";
const errorClass = "mt-1 text-xs text-red-500";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  branchId?: string;
  /** When set, drawer opens in edit mode for this event. */
  event?: CalendarEvent | null;
};

export function NewEventDrawer({
  open,
  onOpenChange,
  defaultDate,
  branchId,
  event,
}: Props) {
  const t = useTranslations("calendar");
  const { activeProfile } = useUserProfileContext();
  const branches = activeProfile?.branches ?? [];
  // Only OWNER may post an org-wide (no-branch) event; everyone else stays
  // branch-scoped (defaulted to the active branch).
  const canOrgWide = isOwner(activeProfile);

  const isEdit = !!event;
  const initialType: CalendarEventType = event?.type ?? "DAY_OFF";
  const [selectedType, setSelectedType] = useState<CalendarEventType>(initialType);
  const [step, setStep] = useState<"type" | "form">(isEdit ? "form" : "type");

  const form = useForm<NewEventFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaForType(selectedType)) as any,
    defaultValues: event
      ? valuesFromEvent(event)
      : defaultValuesForType(selectedType, branchId),
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = form;

  // Re-sync form when the event prop changes (edit a different event)
  useEffect(() => {
    if (event) {
      setSelectedType(event.type);
      setStep("form");
      reset(valuesFromEvent(event));
    }
  }, [event, reset]);

  // Active branch to fall back on when a Private / This-branch audience needs a
  // concrete branch (org-wide stores none).
  const fallbackBranchId =
    branchId ?? branches[0]?.branch_id ?? branches[0]?.id ?? "";

  const currentBranchId = watch("branch_id") as string | undefined;
  const currentVisibility = watch("visibility") as CalendarVisibility | undefined;
  const audience = computeAudience(currentBranchId, currentVisibility);

  function selectAudience(next: Audience) {
    if (next === "ORG_WIDE") {
      setValue("branch_id", "", { shouldValidate: false });
      setValue("visibility", "ORGANIZATION", { shouldValidate: false });
      return;
    }
    // Private / This branch both need a concrete branch — restore one if we're
    // coming back from org-wide.
    if (!currentBranchId) {
      setValue("branch_id", fallbackBranchId, { shouldValidate: false });
    }
    setValue("visibility", next === "PRIVATE" ? "PRIVATE" : "ORGANIZATION", {
      shouldValidate: false,
    });
  }

  const createMut = useCreateCalendarEvent({
    onSuccess: () => {
      toast.success(t("form.success"));
      handleClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t("form.error"));
    },
  });

  const updateMut = useUpdateCalendarEvent({
    onSuccess: () => {
      toast.success(t("form.updateSuccess"));
      handleClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t("form.error"));
    },
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function handleTypeSelect(type: CalendarEventType) {
    setSelectedType(type);
    reset(defaultValuesForType(type, branchId));
  }

  function handleClose() {
    onOpenChange(false);
    setStep(isEdit ? "form" : "type");
    if (!isEdit) {
      setSelectedType("DAY_OFF");
      reset(defaultValuesForType("DAY_OFF", branchId));
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (isEdit && event) {
      await updateMut.mutateAsync({
        id: event.id,
        body: buildUpdateRequest(values, event),
      });
    } else {
      await createMut.mutateAsync(buildCreateRequest(values));
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-y-0 inset-e-0 z-40 flex w-full max-w-md flex-col bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          aria-describedby="new-event-desc"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <Dialog.Title className="text-sm font-semibold text-brand-black">
              {isEdit ? t("form.editTitle") : t("form.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-black transition-colors"
                aria-label={t("form.close")}
              >
                <X className="size-4" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <span id="new-event-desc" className="sr-only">
            {isEdit ? t("form.editTitle") : t("form.title")}
          </span>

          <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {step === "type" && !isEdit ? (
                <TypePicker
                  t={t}
                  selected={selectedType}
                  onSelect={handleTypeSelect}
                />
              ) : (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className={labelClass}>{t("form.name")} *</label>
                    <input
                      {...register("title")}
                      className={inputClass}
                      placeholder={t(`types.${selectedType}`)}
                      autoFocus
                    />
                    {errors?.title && (
                      <p className={errorClass}>{errors.title.message}</p>
                    )}
                  </div>

                  {/* Date/Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{t("form.startsAt")} *</label>
                      <input
                        {...register("start_at")}
                        type="datetime-local"
                        defaultValue={
                          !isEdit && defaultDate ? `${defaultDate}T08:00` : undefined
                        }
                        className={inputClass}
                      />
                      {errors?.start_at && (
                        <p className={errorClass}>{errors.start_at.message}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>{t("form.endsAt")} *</label>
                      <input
                        {...register("end_at")}
                        type="datetime-local"
                        defaultValue={
                          !isEdit && defaultDate ? `${defaultDate}T09:00` : undefined
                        }
                        className={inputClass}
                      />
                      {errors?.end_at && (
                        <p className={errorClass}>{errors.end_at.message}</p>
                      )}
                    </div>
                  </div>

                  {/* All day */}
                  <label className="flex items-center gap-2 text-sm text-brand-black">
                    <input
                      type="checkbox"
                      {...register("all_day")}
                      className="size-4 accent-brand-primary"
                    />
                    {t("form.allDay")}
                  </label>

                  {/* Audience — single selector merging branch scope + visibility */}
                  <div>
                    <label className={labelClass}>{t("audience.title")}</label>
                    <div className="space-y-2">
                      <AudienceOption
                        active={audience === "PRIVATE"}
                        icon={<Lock className="size-4" aria-hidden />}
                        label={t("audience.PRIVATE")}
                        hint={t("audience.PRIVATE_hint")}
                        onClick={() => selectAudience("PRIVATE")}
                      />
                      <AudienceOption
                        active={audience === "THIS_BRANCH"}
                        icon={<Building2 className="size-4" aria-hidden />}
                        label={t("audience.BRANCH")}
                        hint={t("audience.BRANCH_hint")}
                        onClick={() => selectAudience("THIS_BRANCH")}
                      />
                      {(canOrgWide || audience === "ORG_WIDE") && (
                        <AudienceOption
                          active={audience === "ORG_WIDE"}
                          icon={<Globe className="size-4" aria-hidden />}
                          label={t("audience.ORG")}
                          hint={t("audience.ORG_hint")}
                          onClick={() => selectAudience("ORG_WIDE")}
                        />
                      )}
                    </div>
                  </div>

                  {/* Branch picker — only when the user spans multiple branches
                      and the event is tied to one (not org-wide). */}
                  {branches.length >= 2 && audience !== "ORG_WIDE" && (
                    <div>
                      <label className={labelClass}>{t("form.branch")}</label>
                      <select {...register("branch_id")} className={inputClass}>
                        {branches.map((b) => (
                          <option
                            key={b.branch_id ?? b.id}
                            value={b.branch_id ?? b.id}
                          >
                            {b.name ?? b.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className={labelClass}>{t("form.description")}</label>
                    <textarea
                      {...register("description")}
                      className={cn(inputClass, "min-h-15 resize-y")}
                      placeholder={t("form.descriptionPlaceholder")}
                    />
                  </div>

                  {/* Type-specific fields */}
                  {selectedType === "PROCEDURE" && (
                    <ProcedureFields
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      register={register as any}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      control={control as any}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      errors={errors as any}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setValue={setValue as any}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      watch={watch as any}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
              {step === "form" && !isEdit ? (
                <button
                  type="button"
                  onClick={() => setStep("type")}
                  className="text-sm text-gray-500 hover:text-brand-black transition-colors"
                >
                  ← {t("form.back")}
                </button>
              ) : (
                <span />
              )}

              {step === "type" && !isEdit ? (
                <Button
                  type="button"
                  onClick={() => setStep("form")}
                  className="ms-auto bg-brand-primary text-white hover:bg-brand-primary/90"
                >
                  {t("form.next")}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-brand-primary text-white hover:bg-brand-primary/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="me-2 size-4 animate-spin" aria-hidden />
                      {isEdit ? t("form.updating") : t("form.saving")}
                    </>
                  ) : isEdit ? (
                    t("form.update")
                  ) : (
                    t("form.save")
                  )}
                </Button>
              )}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Type picker ────────────────────────────────────────────────────────────

