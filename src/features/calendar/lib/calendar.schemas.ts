import { z } from "zod";

const baseEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    start_at: z.string().min(1, "Start time is required"),
    end_at: z.string().min(1, "End time is required"),
    all_day: z.boolean().optional(),
    visibility: z.enum(["PRIVATE", "ORGANIZATION"]).optional(),
    branch_id: z.string().uuid().optional().or(z.literal("")),
  })
  .refine(
    (v) => {
      const s = new Date(v.start_at).getTime();
      const e = new Date(v.end_at).getTime();
      return !Number.isNaN(s) && !Number.isNaN(e) && e > s;
    },
    { message: "End must be after start", path: ["end_at"] },
  );

export const dayOffEventSchema = baseEventSchema.and(
  z.object({ event_type: z.literal("DAY_OFF") }),
);

export const procedureEventSchema = baseEventSchema.and(
  z.object({
    event_type: z.literal("PROCEDURE"),
    procedure_id: z.string().uuid("Procedure is required"),
    patient_id: z.string().uuid().optional().or(z.literal("")),
  }),
);

export const meetingEventSchema = baseEventSchema.and(
  z.object({ event_type: z.literal("MEETING") }),
);

export const genericEventSchema = baseEventSchema.and(
  z.object({ event_type: z.literal("GENERIC") }),
);

export const newEventSchema = z.union([
  dayOffEventSchema,
  procedureEventSchema,
  meetingEventSchema,
  genericEventSchema,
]);

export type DayOffEventFormValues = z.infer<typeof dayOffEventSchema>;
export type ProcedureEventFormValues = z.infer<typeof procedureEventSchema>;
export type MeetingEventFormValues = z.infer<typeof meetingEventSchema>;
export type GenericEventFormValues = z.infer<typeof genericEventSchema>;
export type NewEventFormValues = z.infer<typeof newEventSchema>;
