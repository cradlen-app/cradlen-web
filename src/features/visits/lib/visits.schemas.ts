import { z } from "zod";
import { VISIT_PRIORITY, VISIT_TYPE } from "./visits.constants";

// ── enums ─────────────────────────────────────────────────────────────────────

export const visitStatusSchema = z.enum([
  "SCHEDULED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const visitTypeSchema = z.enum(["VISIT", "FOLLOW_UP", "MEDICAL_REP"]);

export const visitPrioritySchema = z.enum(["NORMAL", "EMERGENCY"]);

export const scheduleEventKindSchema = z.enum([
  "visit",
  "appointment",
  "meeting",
  "break",
]);

export const waitingListFilterSchema = z.enum([
  "all",
  "VISIT",
  "FOLLOW_UP",
  "MEDICAL_REP",
  "EMERGENCY",
]);

// ── form: book-visit ──────────────────────────────────────────────────────────

const phoneRegex = /^\+?[0-9 ()-]{6,}$/;

export const bookVisitSchema = z
  .object({
    patientMode: z.enum(["existing", "new"]),

    // existing patient
    patientId: z.string().trim().optional(),

    // new patient fields
    fullName: z.string().trim().optional(),
    nationalId: z.string().trim().optional(),
    dateOfBirth: z.string().trim().optional(),
    phoneNumber: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || phoneRegex.test(v), "Enter a valid phone number"),
    address: z.string().trim().optional(),
    isMarried: z.boolean().optional(),
    husbandName: z.string().trim().optional(),
    company: z.string().trim().optional(),

    // visit fields
    visitType: visitTypeSchema,
    priority: visitPrioritySchema,
    assignedDoctorId: z.string().trim().min(1, "Select a doctor"),
    scheduledAt: z.string().trim().optional(),
    notes: z.string().trim().max(500).optional(),
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
      if (!value.fullName?.trim()) {
        ctx.addIssue({ code: "custom", path: ["fullName"], message: "Name is required" });
      }
      if (!value.phoneNumber?.trim()) {
        ctx.addIssue({ code: "custom", path: ["phoneNumber"], message: "Phone is required" });
      }
      if (value.visitType !== VISIT_TYPE.MEDICAL_REP) {
        if (!value.nationalId?.trim()) {
          ctx.addIssue({ code: "custom", path: ["nationalId"], message: "National ID is required" });
        }
        if (!value.dateOfBirth?.trim()) {
          ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Date of birth is required" });
        }
        if (value.isMarried && !value.husbandName?.trim()) {
          ctx.addIssue({ code: "custom", path: ["husbandName"], message: "Husband name is required" });
        }
      }
    }
  });

export type BookVisitFormValues = z.infer<typeof bookVisitSchema>;

export function getDefaultBookVisitValues(): BookVisitFormValues {
  return {
    patientMode: "new",
    patientId: "",
    fullName: "",
    nationalId: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    isMarried: false,
    husbandName: "",
    company: "",
    visitType: VISIT_TYPE.VISIT,
    priority: VISIT_PRIORITY.NORMAL,
    assignedDoctorId: "",
    scheduledAt: "",
    notes: "",
  };
}
