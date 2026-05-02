import { useTranslations } from "next-intl";
import { normalizeRoleName } from "@/features/auth/lib/current-user";

export type SettingsT = ReturnType<typeof useTranslations>;
export type SettingsLocale = "en" | "ar";

function readFormValue(form: HTMLFormElement, name: string) {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function getFormString(form: HTMLFormElement, name: string) {
  return readFormValue(form, name);
}

export function getFormBoolean(form: HTMLFormElement, name: string) {
  return new FormData(form).get(name) === "on";
}

export function getSpecialities(value: string) {
  return value
    .split(",")
    .map((speciality) => speciality.trim())
    .filter(Boolean);
}

export function hasRequiredValues(
  form: HTMLFormElement,
  requiredFields: string[],
) {
  return requiredFields.every((field) => readFormValue(form, field));
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
