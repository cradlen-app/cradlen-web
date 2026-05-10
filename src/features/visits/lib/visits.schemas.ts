import { z } from "zod";
import {
  CC_META_CATEGORIES_MAX,
  CC_META_FIELD_MAX,
  CHIEF_COMPLAINT_CATEGORIES,
  CHIEF_COMPLAINT_MAX,
  VISIT_PRIORITY,
  VISIT_TYPE,
  VITAL_SEVERITY,
} from "./visits.constants";

// ── enums ─────────────────────────────────────────────────────────────────────

export const visitStatusSchema = z.enum([
  "SCHEDULED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

const VISIT_TYPE_VALUES = [VISIT_TYPE.VISIT, VISIT_TYPE.FOLLOW_UP, VISIT_TYPE.MEDICAL_REP] as const;
export const visitTypeSchema = z.enum(VISIT_TYPE_VALUES);

const VISIT_PRIORITY_VALUES = [VISIT_PRIORITY.NORMAL, VISIT_PRIORITY.EMERGENCY] as const;
export const visitPrioritySchema = z.enum(VISIT_PRIORITY_VALUES);

export const scheduleEventKindSchema = z.enum([
  "visit",
  "appointment",
  "meeting",
  "break",
]);

export const waitingListFilterSchema = z.enum([
  "all",
  VISIT_TYPE.VISIT,
  VISIT_TYPE.FOLLOW_UP,
  VISIT_TYPE.MEDICAL_REP,
  VISIT_PRIORITY.EMERGENCY,
]);

// ── form: book-visit ──────────────────────────────────────────────────────────

const PHONE_NUMBER_REGEXES = [
  /^(?:\+20|0020|0)?1[0125]\d{8}$/,
  /^\+[1-9]\d{7,14}$/,
];

function isValidOptionalPhone(value: string | undefined) {
  const normalized = value?.replace(/[\s().-]/g, "") ?? "";
  if (!normalized) return true;
  return PHONE_NUMBER_REGEXES.some((regex) => regex.test(normalized));
}

const VALID_GOVERNORATE_CODES = new Set([
  "01", "02", "03", "04", "11", "12", "13", "14", "15", "16",
  "17", "18", "19", "21", "22", "23", "24", "25", "26", "27",
  "28", "29", "31", "32", "33", "34", "35", "88",
]);

function isValidEgyptianNationalId(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized) return true;
  if (!/^\d{14}$/.test(normalized)) return false;

  const centuryDigit = normalized[0];
  if (centuryDigit !== "2" && centuryDigit !== "3") return false;
  const century = centuryDigit === "2" ? 1900 : 2000;

  const year = century + Number(normalized.slice(1, 3));
  const month = Number(normalized.slice(3, 5));
  const day = Number(normalized.slice(5, 7));

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  const govCode = normalized.slice(7, 9);
  if (!VALID_GOVERNORATE_CODES.has(govCode)) return false;

  return true;
}

type Translator = (key: string) => string;

const identity: Translator = (key) => key;

// Vitals are kept as optional strings on the form; they're parsed/validated
// at submit time. This avoids zod transform inference quirks with RHF.
function vitalString(min: number, max: number, t: Translator) {
  return z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const n = Number(value);
      return Number.isFinite(n) && n >= min && n <= max;
    }, t("create.errors.invalidVital"));
}

const optionalShortString = z.string().trim().max(CC_META_FIELD_MAX).optional();

export function makeVisitIntakeSchema(t: Translator = identity) {
  return z.object({
    chiefComplaint: z.string().trim().max(CHIEF_COMPLAINT_MAX).optional(),
    chiefComplaintCategories: z
      .array(z.enum(CHIEF_COMPLAINT_CATEGORIES))
      .max(CC_META_CATEGORIES_MAX)
      .optional(),
    chiefComplaintOnset: optionalShortString,
    chiefComplaintDuration: optionalShortString,
    chiefComplaintSeverity: z.enum(VITAL_SEVERITY).optional(),
    vitalsSystolicBp: vitalString(60, 260, t),
    vitalsDiastolicBp: vitalString(30, 200, t),
    vitalsPulse: vitalString(20, 250, t),
    vitalsTemperatureC: vitalString(30, 45, t),
    vitalsRespiratoryRate: vitalString(5, 80, t),
    vitalsSpo2: vitalString(0, 100, t),
    vitalsWeightKg: vitalString(0, 400, t),
    vitalsHeightCm: vitalString(30, 260, t),
  });
}

export type VisitIntakeFormValues = z.infer<ReturnType<typeof makeVisitIntakeSchema>>;

export function parseVitalNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function makeBookVisitSchema(t: Translator = identity) {
  const intake = makeVisitIntakeSchema(t).shape;

  return z
    .object({
      patientMode: z.enum(["existing", "new"]),

      // existing patient
      patientId: z.string().trim().optional(),

      // new patient fields
      fullName: z.string().trim().optional(),
      nationalId: z
        .string()
        .trim()
        .optional()
        .refine(isValidEgyptianNationalId, t("create.errors.invalidNationalId")),
      dateOfBirth: z.string().trim().optional(),
      phoneNumber: z
        .string()
        .trim()
        .optional()
        .refine(isValidOptionalPhone, t("create.errors.invalidPhone")),
      address: z.string().trim().optional(),
      isMarried: z.boolean().optional(),
      husbandName: z.string().trim().optional(),
      company: z.string().trim().optional(),

      // visit fields
      visitType: visitTypeSchema,
      priority: visitPrioritySchema,
      assignedDoctorId: z.string().trim().min(1, t("create.errors.doctorRequired")),
      scheduledAt: z.string().trim().optional(),

      // structured intake (optional)
      ...intake,
    })
    .superRefine((value, ctx) => {
      if (value.patientMode === "existing") {
        if (!value.patientId) {
          ctx.addIssue({
            code: "custom",
            path: ["patientId"],
            message: t("create.errors.patientRequired"),
          });
        }
      } else {
        if (!value.fullName?.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["fullName"],
            message: t("create.errors.fullNameRequired"),
          });
        }
        if (!value.phoneNumber?.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["phoneNumber"],
            message: t("create.errors.phoneRequired"),
          });
        }
        if (value.visitType !== VISIT_TYPE.MEDICAL_REP) {
          if (!value.nationalId?.trim()) {
            ctx.addIssue({
              code: "custom",
              path: ["nationalId"],
              message: t("create.errors.nationalIdRequired"),
            });
          }
          if (!value.dateOfBirth?.trim()) {
            ctx.addIssue({
              code: "custom",
              path: ["dateOfBirth"],
              message: t("create.errors.dobRequired"),
            });
          }
          if (value.isMarried && !value.husbandName?.trim()) {
            ctx.addIssue({
              code: "custom",
              path: ["husbandName"],
              message: t("create.errors.husbandNameRequired"),
            });
          }
        }
      }
    });
}

export const bookVisitSchema = makeBookVisitSchema();

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
    chiefComplaint: "",
    chiefComplaintCategories: [],
    chiefComplaintOnset: "",
    chiefComplaintDuration: "",
    chiefComplaintSeverity: undefined,
    vitalsSystolicBp: "",
    vitalsDiastolicBp: "",
    vitalsPulse: "",
    vitalsTemperatureC: "",
    vitalsRespiratoryRate: "",
    vitalsSpo2: "",
    vitalsWeightKg: "",
    vitalsHeightCm: "",
  };
}
