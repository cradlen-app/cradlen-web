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
