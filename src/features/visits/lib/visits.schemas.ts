import { z } from "zod";

// ── enums ─────────────────────────────────────────────────────────────────────

export const visitStatusSchema = z.enum([
  "pending",
  "waiting",
  "in_progress",
  "completed",
  "cancelled",
]);

export const visitTypeSchema = z.enum(["visit", "follow_up", "medical_rep"]);

export const visitPrioritySchema = z.enum(["normal", "emergency"]);

export const scheduleEventKindSchema = z.enum([
  "visit",
  "appointment",
  "meeting",
  "break",
]);

export const waitingListFilterSchema = z.enum([
  "all",
  "visit",
  "follow_up",
  "medical_rep",
  "emergency",
]);

// ── form: create-visit ────────────────────────────────────────────────────────

const newPatientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(/^\+?[0-9 ()-]{6,}$/, "Enter a valid phone number"),
  code: z.string().trim().optional(),
});

export const createVisitSchema = z
  .object({
    patientMode: z.enum(["existing", "new"]),
    patientId: z.string().trim().optional(),
    newPatient: newPatientSchema.optional(),
    type: visitTypeSchema,
    priority: visitPrioritySchema,
    assignedDoctorId: z.string().trim().optional(),
    complaint: z.string().trim().max(500).optional(),
    scheduledAt: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.patientMode === "existing") {
      if (!value.patientId) {
        ctx.addIssue({
          code: "custom",
          path: ["patientId"],
          message: "Select a patient",
        });
      }
    } else {
      if (!value.newPatient) {
        ctx.addIssue({
          code: "custom",
          path: ["newPatient"],
          message: "Patient details are required",
        });
      }
    }
    if (value.type === "visit" && !value.assignedDoctorId) {
      ctx.addIssue({
        code: "custom",
        path: ["assignedDoctorId"],
        message: "Select a doctor for this visit",
      });
    }
  });

export type CreateVisitFormValues = z.infer<typeof createVisitSchema>;

export function getDefaultCreateVisitValues(): CreateVisitFormValues {
  return {
    patientMode: "new",
    patientId: "",
    newPatient: {
      firstName: "",
      lastName: "",
      phone: "",
      code: "",
    },
    type: "visit",
    priority: "normal",
    assignedDoctorId: "",
    complaint: "",
    scheduledAt: "",
  };
}
