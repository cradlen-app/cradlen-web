import { useTranslations } from "next-intl";
import { normalizeRoleName } from "@/features/auth/lib/current-user";
import type { EngagementType, ExecutiveTitle } from "@/types/user.types";

export type SettingsT = ReturnType<typeof useTranslations>;
export type SettingsLocale = "en" | "ar";

export function getFormString(form: HTMLFormElement, name: string) {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function hasRequiredValues(
  form: HTMLFormElement,
  requiredFields: string[],
) {
  return requiredFields.every((field) => getFormString(form, field));
}

export function formatRole(role: string | undefined, t: SettingsT) {
  if (!role) return t("empty.missing");
  return t(`roles.${normalizeRoleName(role)}`);
}

export function formatOrgStatus(status: string | undefined, t: SettingsT) {
  if (!status) return t("empty.missing");
  const key = status.toUpperCase();
  if (key === "ACTIVE" || key === "INACTIVE" || key === "SUSPENDED") {
    return t(`orgStatus.${key}`);
  }
  return status;
}

export function formatExecutiveTitle(
  title: ExecutiveTitle | null | undefined,
  t: SettingsT,
) {
  if (!title) return t("empty.missing");
  return t(`executiveTitles.${title}`);
}

export function formatEngagementType(
  engagement: EngagementType | null | undefined,
  t: SettingsT,
) {
  if (!engagement) return t("empty.missing");
  return t(`engagementTypes.${engagement}`);
}

export function formatSettingsDateTime(
  value: string | null | undefined,
  locale: SettingsLocale,
) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Returns only the keys whose value differs between `next` and `prev`. */
export function pickDirty<T extends Record<string, unknown>>(
  next: T,
  prev: Partial<T>,
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (!shallowEqual(next[key], prev[key])) {
      out[key] = next[key];
    }
  }
  return out;
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  return false;
}
