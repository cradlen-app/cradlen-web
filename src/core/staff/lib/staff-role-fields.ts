import {
  DOCTOR_JOB_FUNCTIONS,
  JOB_FUNCTION_CODE,
  JOB_ROLE,
  type JobRoleCode,
} from "@/features/auth/lib/auth.constants";
import type { StaffMember } from "../types/staff.types";

/**
 * Coarse job-function picker shared by the owner-signup and staff add/edit
 * forms. A person is exactly one of Doctor / Receptionist / Accountant / None.
 */
export type StaffRoleFieldValues = {
  jobRole: JobRoleCode;
  doctorSpecialty: string;
  professionalTitle?: string;
};

/** Backend role fields produced from the coarse picker. */
export type StaffRoleFieldPayload = {
  /** Single job-function code, or null to clear (NONE / doctor without specialty). */
  job_function_code: string | null;
  specialty_codes: string[];
  professional_title?: string;
};

/**
 * Map the coarse picker to the backend's flat code arrays + professional title.
 * Mirrors the owner-signup builder (register-organization.ts): DOCTOR maps to
 * the single DOCTOR job function plus the chosen Specialty (which drives
 * examination templates); the other roles map to a single code; NONE clears
 * both arrays.
 */
export function buildStaffRoleFields(
  values: StaffRoleFieldValues,
): StaffRoleFieldPayload {
  switch (values.jobRole) {
    case JOB_ROLE.DOCTOR: {
      const payload: StaffRoleFieldPayload = values.doctorSpecialty
        ? {
            job_function_code: JOB_FUNCTION_CODE.DOCTOR,
            specialty_codes: [values.doctorSpecialty],
          }
        : { job_function_code: null, specialty_codes: [] };
      const title = values.professionalTitle?.trim();
      if (title) payload.professional_title = title;
      return payload;
    }
    case JOB_ROLE.RECEPTIONIST:
      return {
        job_function_code: JOB_FUNCTION_CODE.RECEPTIONIST,
        specialty_codes: [],
      };
    case JOB_ROLE.ACCOUNTANT:
      return {
        job_function_code: JOB_FUNCTION_CODE.ACCOUNTANT,
        specialty_codes: [],
      };
    case JOB_ROLE.NONE:
    default:
      return { job_function_code: null, specialty_codes: [] };
  }
}

/**
 * Reverse-derive the coarse job role from a set of job-function codes. DOCTOR
 * (and any legacy clinical doctor code) → DOCTOR; RECEPTIONIST / ACCOUNTANT map
 * to themselves; everything else (incl. legacy NURSE / ASSISTANT, no longer
 * offered) → NONE. Used by the edit form and the staff/invitation detail views.
 */
export function deriveJobRoleFromCodes(codes: readonly string[]): JobRoleCode {
  const doctorCodes = DOCTOR_JOB_FUNCTIONS as readonly string[];
  if (codes.some((code) => doctorCodes.includes(code))) return JOB_ROLE.DOCTOR;
  if (codes.includes(JOB_FUNCTION_CODE.RECEPTIONIST)) return JOB_ROLE.RECEPTIONIST;
  if (codes.includes(JOB_FUNCTION_CODE.ACCOUNTANT)) return JOB_ROLE.ACCOUNTANT;
  return JOB_ROLE.NONE;
}

/**
 * Reverse-derive the coarse picker state from an existing staff member, for the
 * edit form.
 */
export function deriveJobRoleFromMember(
  member: Pick<StaffMember, "jobFunction" | "specialties" | "professionalTitle">,
): StaffRoleFieldValues {
  const jobRole = deriveJobRoleFromCodes(
    member.jobFunction ? [member.jobFunction.code] : [],
  );
  if (jobRole === JOB_ROLE.DOCTOR) {
    return {
      jobRole,
      doctorSpecialty: member.specialties[0]?.code ?? "",
      professionalTitle: member.professionalTitle ?? "",
    };
  }
  return { jobRole, doctorSpecialty: "", professionalTitle: "" };
}
