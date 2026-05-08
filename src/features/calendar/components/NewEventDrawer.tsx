"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, Stethoscope, Users, User, PalmtreeIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCreateCalendarEvent } from "../hooks/useCreateCalendarEvent";
import {
  surgeryEventSchema,
  meetingEventSchema,
  personalEventSchema,
  leaveEventSchema,
  type NewEventFormValues,
  type SurgeryEventFormValues,
  type MeetingEventFormValues,
  type PersonalEventFormValues,
  type LeaveEventFormValues,
} from "../lib/calendar.schemas";
import type { CalendarEventType } from "../types/calendar.types";
import type { CreateCalendarEventRequest } from "../types/calendar.api.types";
import { ConflictDialog } from "./ConflictDialog";
import {
  SurgeryFields,
  MeetingFields,
  LeaveFields,
  PersonalFields,
} from "./NewEventTypeFields";
import type { Conflict } from "../types/calendar.types";

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
    type: "SURGERY",
    icon: <Stethoscope className="size-5" aria-hidden />,
    color: "text-red-500",
    bgColor: "bg-red-50 border-red-200 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-50",
  },
  {
    type: "MEETING",
    icon: <Users className="size-5" aria-hidden />,
    color: "text-brand-primary",
    bgColor: "bg-green-50 border-green-200 data-[selected=true]:border-brand-primary data-[selected=true]:bg-green-50",
  },
  {
    type: "PERSONAL",
    icon: <User className="size-5" aria-hidden />,
    color: "text-amber-500",
    bgColor: "bg-amber-50 border-amber-200 data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-50",
  },
  {
    type: "LEAVE",
    icon: <PalmtreeIcon className="size-5" aria-hidden />,
    color: "text-gray-500",
    bgColor: "bg-gray-50 border-gray-200 data-[selected=true]:border-gray-500 data-[selected=true]:bg-gray-100",
  },
];

function schemaForType(type: CalendarEventType) {
  switch (type) {
    case "SURGERY": return surgeryEventSchema;
    case "MEETING": return meetingEventSchema;
    case "PERSONAL": return personalEventSchema;
    case "LEAVE": return leaveEventSchema;
  }
}

function defaultValuesForType(type: CalendarEventType) {
  const base = {
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    all_day: false,
  };
  switch (type) {
    case "SURGERY":
      return { ...base, type: "SURGERY" as const, branch_id: "", patient_id: "", details: { surgery_name: "", surgery_type: "", operating_room: "", pre_op_notes: "" }, participants: [] };
    case "MEETING":
      return { ...base, type: "MEETING" as const, details: { location: "", virtual_link: "", agenda: "" }, participants: [] };
    case "PERSONAL":
      return { ...base, type: "PERSONAL" as const };
    case "LEAVE":
      return { ...base, type: "LEAVE" as const, details: { reason: "" } };
  }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  branchId?: string;
};

export function NewEventDrawer({ open, onOpenChange, defaultDate, branchId }: Props) {
  const t = useTranslations("calendar");
  const [selectedType, setSelectedType] = useState<CalendarEventType>("SURGERY");
  const [step, setStep] = useState<"type" | "form">("type");
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);

  const form = useForm<NewEventFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaForType(selectedType)) as any,
    defaultValues: defaultValuesForType(selectedType),
    mode: "onSubmit",
  });

  const { register, handleSubmit, control, setValue, formState: { errors }, reset } = form;

  const mutation = useCreateCalendarEvent({
    onSuccess: (conflicts) => {
      if (conflicts.length > 0) {
        setPendingConflicts(conflicts);
      } else {
        handleClose();
      }
    },
  });

  function handleTypeSelect(type: CalendarEventType) {
    setSelectedType(type);
    reset(defaultValuesForType(type));
  }

  function handleClose() {
    onOpenChange(false);
    setPendingConflicts([]);
    setStep("type");
    reset(defaultValuesForType("SURGERY"));
    setSelectedType("SURGERY");
  }

  const onSubmit = handleSubmit(async (values) => {
    const body = buildRequest(values, branchId);
    await mutation.mutateAsync(body);
  });

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed inset-y-0 inset-e-0 z-40 flex w-full max-w-md flex-col bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
            aria-describedby="new-event-desc"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <Dialog.Title className="text-sm font-semibold text-brand-black">
                {t("form.title")}
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

            <span id="new-event-desc" className="sr-only">{t("form.title")}</span>

            {/* Body */}
            <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {step === "type" ? (
                  <TypePicker
                    t={t}
                    selected={selectedType}
                    onSelect={handleTypeSelect}
                  />
                ) : (
                  <EventForm
                    type={selectedType}
                    register={register}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    defaultDate={defaultDate}
                    t={t}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
                {step === "form" ? (
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

                {step === "type" ? (
                  <Button
                    type="button"
                    onClick={() => setStep("form")}
                    className="ms-auto"
                  >
                    {t("form.next")}
                  </Button>
                ) : (
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="me-2 size-4 animate-spin" aria-hidden />
                        {t("form.saving")}
                      </>
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

      <ConflictDialog
        open={pendingConflicts.length > 0}
        conflicts={pendingConflicts}
        onConfirm={handleClose}
        onCancel={() => setPendingConflicts([])}
      />
    </>
  );
}

// ── Type picker step ───────────────────────────────────────────────────────────

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

// ── Form step ──────────────────────────────────────────────────────────────────

function EventForm({
  type,
  register,
  control,
  errors,
  setValue,
  defaultDate,
  t,
}: {
  type: CalendarEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  defaultDate?: string;
  t: ReturnType<typeof useTranslations<"calendar">>;
}) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className={labelClass}>{t("form.name")} *</label>
        <input
          {...register("title")}
          className={inputClass}
          placeholder={t(`types.${type}`)}
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
            {...register("starts_at")}
            type="datetime-local"
            defaultValue={defaultDate ? `${defaultDate}T08:00` : undefined}
            className={inputClass}
          />
          {errors?.starts_at && (
            <p className={errorClass}>{errors.starts_at.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>{t("form.endsAt")} *</label>
          <input
            {...register("ends_at")}
            type="datetime-local"
            defaultValue={defaultDate ? `${defaultDate}T09:00` : undefined}
            className={inputClass}
          />
          {errors?.ends_at && (
            <p className={errorClass}>{errors.ends_at.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>{t("form.description")}</label>
        <textarea
          {...register("description")}
          className={cn(inputClass, "min-h-15 resize-y")}
          placeholder="Optional notes..."
        />
      </div>

      {/* Type-specific fields */}
      {type === "SURGERY" && (
        <SurgeryFields register={register} control={control} errors={errors} setValue={setValue} />
      )}
      {type === "MEETING" && (
        <MeetingFields register={register} control={control} errors={errors} setValue={setValue} />
      )}
      {type === "LEAVE" && <LeaveFields register={register} />}
      {type === "PERSONAL" && <PersonalFields />}
    </div>
  );
}

// ── Build API request from form values ─────────────────────────────────────────

function buildRequest(values: NewEventFormValues, branchId?: string): CreateCalendarEventRequest {
  const base = {
    type: values.type,
    title: values.title,
    description: values.description || undefined,
    starts_at: new Date(values.starts_at).toISOString(),
    ends_at: new Date(values.ends_at).toISOString(),
    all_day: values.all_day,
    branch_id: branchId,
  };

  if (values.type === "SURGERY") {
    const v = values as SurgeryEventFormValues;
    return {
      ...base,
      branch_id: v.branch_id,
      patient_id: v.patient_id,
      details: {
        surgery_name: v.details.surgery_name,
        surgery_type: v.details.surgery_type || undefined,
        operating_room: v.details.operating_room || undefined,
        pre_op_notes: v.details.pre_op_notes || undefined,
        expected_duration_minutes: v.details.expected_duration_minutes,
      },
      participants: v.participants.map((p) => ({
        profile_id: p.profile_id,
        role: p.role as "PRIMARY_DOCTOR" | "ASSISTANT",
      })),
    };
  }

  if (values.type === "MEETING") {
    const v = values as MeetingEventFormValues;
    return {
      ...base,
      details: {
        location: v.details.location || undefined,
        virtual_link: v.details.virtual_link || undefined,
        agenda: v.details.agenda || undefined,
      },
      participants: (v.participants ?? []).map((p) => ({
        profile_id: p.profile_id,
        role: "ATTENDEE" as const,
      })),
    };
  }

  if (values.type === "LEAVE") {
    const v = values as LeaveEventFormValues;
    return {
      ...base,
      details: { reason: v.details.reason || undefined },
    };
  }

  // PERSONAL
  return base;
}
