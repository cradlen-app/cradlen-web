import type { RegisterPersonalRequest, Step1Data } from "../types/sign-up.types";
import { normalizeSignupEmail } from "./registration-session";

const PHONE_SEPARATOR_REGEX = /[\s().-]/g;

export function normalizeSignupPhoneNumber(value: string | undefined) {
  const normalized = value?.replace(PHONE_SEPARATOR_REGEX, "").trim() ?? "";

  if (!normalized) return undefined;
  if (normalized.startsWith("0020")) return `+20${normalized.slice(4)}`;
  if (normalized.startsWith("0")) return `+20${normalized.slice(1)}`;

  return normalized;
}

export function buildSignupStartRequest(data: Step1Data): RegisterPersonalRequest {
  const phoneNumber = normalizeSignupPhoneNumber(data.phoneNumber);
  const payload: RegisterPersonalRequest = {
    first_name: data.firstName,
    last_name: data.lastName,
    email: normalizeSignupEmail(data.email),
    password: data.password,
    confirm_password: data.confirmPassword,
  };

  if (phoneNumber) payload.phone_number = phoneNumber;

  return payload;
}
