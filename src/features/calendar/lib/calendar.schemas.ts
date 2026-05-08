import { z } from "zod";

const baseEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional(),
  starts_at: z.string().min(1, "Start time is required"),
  ends_at: z.string().min(1, "End time is required"),
  all_day: z.boolean().optional(),
});

export const surgeryEventSchema = baseEventSchema.extend({
  type: z.literal("SURGERY"),
  branch_id: z.string().min(1, "Branch is required"),
  patient_id: z.string().min(1, "Patient is required"),
  details: z.object({
    surgery_name: z.string().min(1, "Surgery name is required"),
    surgery_type: z.string().optional(),
    operating_room: z.string().optional(),
    pre_op_notes: z.string().optional(),
    expected_duration_minutes: z.coerce.number().int().positive().optional(),
  }),
  participants: z
    .array(
      z.object({
        profile_id: z.string().min(1),
        role: z.enum(["PRIMARY_DOCTOR", "ASSISTANT"]),
        name: z.string().optional(),
      }),
    )
    .refine(
      (arr) => arr.filter((p) => p.role === "PRIMARY_DOCTOR").length === 1,
      "Exactly one primary doctor is required",
    ),
});

export const meetingEventSchema = baseEventSchema.extend({
  type: z.literal("MEETING"),
  details: z.object({
    location: z.string().optional(),
    virtual_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    agenda: z.string().optional(),
  }),
  participants: z
    .array(
      z.object({
        profile_id: z.string().min(1),
        role: z.literal("ATTENDEE"),
        name: z.string().optional(),
      }),
    )
    .optional(),
});

export const personalEventSchema = baseEventSchema.extend({
  type: z.literal("PERSONAL"),
});

export const leaveEventSchema = baseEventSchema.extend({
  type: z.literal("LEAVE"),
  details: z.object({
    reason: z.string().optional(),
  }),
});

export const newEventSchema = z.discriminatedUnion("type", [
  surgeryEventSchema,
  meetingEventSchema,
  personalEventSchema,
  leaveEventSchema,
]);

export type SurgeryEventFormValues = z.infer<typeof surgeryEventSchema>;
export type MeetingEventFormValues = z.infer<typeof meetingEventSchema>;
export type PersonalEventFormValues = z.infer<typeof personalEventSchema>;
export type LeaveEventFormValues = z.infer<typeof leaveEventSchema>;
export type NewEventFormValues = z.infer<typeof newEventSchema>;
