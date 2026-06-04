/**
 * Presentation helpers for patient-portal medications.
 *
 * Pure (no React/i18n) so the screen component stays thin and a future real-data
 * layer can reuse the same icon/duration mapping. Strings that need translation
 * are resolved in the component via `useTranslations`.
 */
import { Droplet, Pill, Syringe, type LucideIcon } from "lucide-react";

import type { MedicationForm } from "../types/patient-portal.types";

/** Icon shown in the card's leading chip, by dosage form. */
export const MED_FORM_ICON: Record<MedicationForm, LucideIcon> = {
  tablet: Pill,
  capsule: Pill,
  injection: Syringe,
  drops: Droplet,
  syrup: Droplet,
  other: Pill,
};

/** i18n sub-key (under `medications.unit`) for the per-dose unit label. */
export function formUnitKey(form: MedicationForm): string {
  switch (form) {
    case "tablet":
      return "tablet";
    case "capsule":
      return "capsule";
    case "injection":
      return "injection";
    case "drops":
      return "drops";
    case "syrup":
      return "syrup";
    default:
      return "tablet";
  }
}

type CourseUnit = {
  /** i18n key (under `medications`) carrying the pluralized label. */
  key: "durationMonths" | "durationWeeks" | "durationDays";
  count: number;
};

/**
 * Picks the friendliest unit for a course length: whole months when divisible
 * by 30, whole weeks when divisible by 7, otherwise days.
 */
export function courseUnit(courseDays: number): CourseUnit {
  if (courseDays > 0 && courseDays % 30 === 0) {
    return { key: "durationMonths", count: courseDays / 30 };
  }
  if (courseDays > 0 && courseDays % 7 === 0) {
    return { key: "durationWeeks", count: courseDays / 7 };
  }
  return { key: "durationDays", count: courseDays };
}
