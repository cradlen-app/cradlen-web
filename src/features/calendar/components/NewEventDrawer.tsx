"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  X,
  Stethoscope,
  Users,
  User,
  PalmtreeIcon,
  Lock,
  Building2,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useCreateCalendarEvent } from "../hooks/useCreateCalendarEvent";
import { useUpdateCalendarEvent } from "../hooks/useUpdateCalendarEvent";
import {
  dayOffEventSchema,
  procedureEventSchema,
  meetingEventSchema,
  genericEventSchema,
  type NewEventFormValues,
} from "../lib/calendar.schemas";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarVisibility,
} from "../types/calendar.types";
import type {
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "../types/calendar.api.types";
import { ProcedureFields } from "./NewEventTypeFields";

const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-black placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-colors";
const errorClass = "mt-1 text-xs text-red-500";

type EventTypeCard = {
  type: CalendarEventType;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
};

const EVENT_TYPE_CARDS: EventTypeCard[] = [
  {
    type: "DAY_OFF",
    icon: <PalmtreeIcon className="size-5" aria-hidden />,
    color: "text-amber-500",
    bgColor:
      "bg-amber-50 border-amber-200 data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-50",
  },
  {
    type: "PROCEDURE",
    icon: <Stethoscope className="size-5" aria-hidden />,
    color: "text-red-500",
    bgColor:
      "bg-red-50 border-red-200 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-50",
  },
  {
    type: "MEETING",
    icon: <Users className="size-5" aria-hidden />,
    color: "text-brand-primary",
    bgColor:
      "bg-green-50 border-green-200 data-[selected=true]:border-brand-primary data-[selected=true]:bg-green-50",
  },
  {
    type: "GENERIC",
    icon: <User className="size-5" aria-hidden />,
    color: "text-gray-500",
    bgColor:
      "bg-gray-50 border-gray-200 data-[selected=true]:border-gray-500 data-[selected=true]:bg-gray-100",
  },
];

const DEFAULT_VISIBILITY: Record<CalendarEventType, CalendarVisibility> = {
  DAY_OFF: "ORGANIZATION",
  PROCEDURE: "ORGANIZATION",
  MEETING: "PRIVATE",
  GENERIC: "PRIVATE",
};

function schemaForType(type: CalendarEventType) {
  switch (type) {
    case "DAY_OFF":
      return dayOffEventSchema;
    case "PROCEDURE":
      return procedureEventSchema;
    case "MEETING":
      return meetingEventSchema;
    case "GENERIC":
      return genericEventSchema;
  }
}

function toDatetimeLocal(iso: string): string {
  // datetime-local needs `YYYY-MM-DDTHH:MM` in *local* time
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultValuesForType(
  type: CalendarEventType,
  branchId?: string,
): NewEventFormValues {
  const base = {
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    all_day: false,
    visibility: DEFAULT_VISIBILITY[type],
    branch_id: branchId ?? "",
  };
  if (type === "PROCEDURE") {
    return {
      ...base,
      event_type: "PROCEDURE" as const,
      procedure_id: "",
      patient_id: "",
      assistant_profile_ids: [],
    };
  }
  return { ...base, event_type: type } as NewEventFormValues;
}

function valuesFromEvent(event: CalendarEvent): NewEventFormValues {
  const base = {
    title: event.title,
    description: event.description ?? "",
    start_at: toDatetimeLocal(event.startsAt),
    end_at: toDatetimeLocal(event.endsAt),
    all_day: event.allDay,
    visibility: event.visibility,
    branch_id: event.branchId ?? "",
  };
  if (event.type === "PROCEDURE") {
    return {
      ...base,
      event_type: "PROCEDURE" as const,
      procedure_id: event.procedureId ?? "",
      patient_id: event.patientId ?? "",
      assistant_profile_ids: event.assistants.map((a) => a.profileId),
    };
  }
  return { ...base, event_type: event.type } as NewEventFormValues;
}

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

  const currentVisibility = watch("visibility") as CalendarVisibility | undefined;

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

                  {/* Branch */}
                  <div>
                    <label className={labelClass}>{t("form.branch")}</label>
                    <select {...register("branch_id")} className={inputClass}>
                      <option value="">{t("form.orgWide")}</option>
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

                  {/* Visibility */}
                  <div>
                    <label className={labelClass}>{t("form.visibility")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <VisibilityCard
                        active={currentVisibility === "ORGANIZATION"}
                        icon={<Building2 className="size-4" aria-hidden />}
                        label={t("visibility.ORGANIZATION")}
                        hint={t("visibility.ORGANIZATION_hint")}
                        onClick={() =>
                          setValue("visibility", "ORGANIZATION", {
                            shouldValidate: false,
                          })
                        }
                      />
                      <VisibilityCard
                        active={currentVisibility === "PRIVATE"}
                        icon={<Lock className="size-4" aria-hidden />}
                        label={t("visibility.PRIVATE")}
                        hint={t("visibility.PRIVATE_hint")}
                        onClick={() =>
                          setValue("visibility", "PRIVATE", {
                            shouldValidate: false,
                          })
                        }
                      />
                    </div>
                  </div>

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
                  className="ms-auto"
                >
                  {t("form.next")}
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
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

function TypePicker({
  t,
  selected,
  onSelect,
}: {
  t: ReturnType<typeof useTranslations<"calendar">>;
  selected: CalendarEventType;
  onSelect: (type: CalendarEventType) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-brand-black">
        {t("form.chooseType")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {EVENT_TYPE_CARDS.map((card) => (
          <button
            key={card.type}
            type="button"
            data-selected={selected === card.type}
            onClick={() => onSelect(card.type)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all hover:opacity-90",
              card.bgColor,
            )}
          >
            <span className={card.color}>{card.icon}</span>
            <span className="text-sm font-medium text-brand-black">
              {t(`types.${card.type}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Visibility toggle card ─────────────────────────────────────────────────

function VisibilityCard({
  active,
  icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border-2 px-3 py-2 text-start transition-all",
        active
          ? "border-brand-primary bg-brand-primary/5"
          : "border-gray-200 bg-white hover:border-gray-300",
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          active ? "text-brand-primary" : "text-brand-black",
        )}
      >
        {icon}
        {label}
      </span>
      <span className="text-[11px] text-gray-500">{hint}</span>
    </button>
  );
}

// ── Request builders ───────────────────────────────────────────────────────

function buildCreateRequest(values: NewEventFormValues): CreateCalendarEventRequest {
  const base: CreateCalendarEventRequest = {
    event_type: values.event_type,
    title: values.title,
    description: values.description?.trim() || undefined,
    start_at: new Date(values.start_at).toISOString(),
    end_at: new Date(values.end_at).toISOString(),
    all_day: values.all_day || undefined,
    visibility: values.visibility,
    branch_id: values.branch_id?.trim() || undefined,
  };

  if (values.event_type === "PROCEDURE") {
    return {
      ...base,
      procedure_id: values.procedure_id,
      patient_id: values.patient_id?.trim() || undefined,
      assistant_profile_ids:
        (values.assistant_profile_ids ?? []).filter(Boolean).length > 0
          ? (values.assistant_profile_ids ?? []).filter(Boolean)
          : undefined,
    };
  }
  return base;
}

function buildUpdateRequest(
  values: NewEventFormValues,
  event: CalendarEvent,
): UpdateCalendarEventRequest {
  // For edit we send the full set every time; the backend treats it as a PATCH.
  // Locked: event_type — backend type swaps would invalidate relations.
  const base: UpdateCalendarEventRequest = {
    title: values.title,
    description: values.description?.trim() || "",
    start_at: new Date(values.start_at).toISOString(),
    end_at: new Date(values.end_at).toISOString(),
    all_day: values.all_day,
    visibility: values.visibility,
    branch_id: values.branch_id?.trim() || undefined,
  };

  if (event.type === "PROCEDURE" && values.event_type === "PROCEDURE") {
    return {
      ...base,
      procedure_id: values.procedure_id,
      patient_id: values.patient_id?.trim() || undefined,
      assistant_profile_ids: (values.assistant_profile_ids ?? []).filter(Boolean),
    };
  }
  return base;
}
