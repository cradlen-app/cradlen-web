import {
  DOCTOR_JOB_FUNCTIONS,
  JOB_FUNCTION_CODE,
  JOB_ROLE,
  deriveDoctorJobFunction,
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
  job_function_codes: string[];
  specialty_codes: string[];
  professional_title?: string;
};

/**
 * Map the coarse picker to the backend's flat code arrays + professional title.
 * Mirrors the owner-signup builder (register-organization.ts): DOCTOR fans out
 * to a clinical job-function code derived from the chosen specialty (which also
 * drives examination templates); the other roles map to a single code; NONE
 * clears both arrays.
 */
export function buildStaffRoleFields(
  values: StaffRoleFieldValues,
): StaffRoleFieldPayload {
  switch (values.jobRole) {
    case JOB_ROLE.DOCTOR: {
      const payload: StaffRoleFieldPayload = values.doctorSpecialty
        ? {
            job_function_codes: [deriveDoctorJobFunction(values.doctorSpecialty)],
            specialty_codes: [values.doctorSpecialty],
          }
        : { job_function_codes: [], specialty_codes: [] };
      const title = values.professionalTitle?.trim();
      if (title) payload.professional_title = title;
      return payload;
    }
    case JOB_ROLE.RECEPTIONIST:
      return {
        job_function_codes: [JOB_FUNCTION_CODE.RECEPTIONIST],
        specialty_codes: [],
      };
    case JOB_ROLE.ACCOUNTANT:
      return {
        job_function_codes: [JOB_FUNCTION_CODE.ACCOUNTANT],
        specialty_codes: [],
      };
    case JOB_ROLE.NONE:
    default:
      return { job_function_codes: [], specialty_codes: [] };
  }
}

/**
 * Reverse-derive the coarse picker state from an existing staff member, for the
 * edit form. Any doctor job function → DOCTOR (with the first specialty code);
 * RECEPTIONIST / ACCOUNTANT map to themselves; everything else (incl. legacy
 * NURSE / ASSISTANT, which the coarse picker no longer offers) → NONE.
 */
export function deriveJobRoleFromMember(
  member: Pick<StaffMember, "jobFunctions" | "specialties" | "professionalTitle">,
): StaffRoleFieldValues {
  const codes = member.jobFunctions.map((fn) => fn.code);
  const doctorCodes = DOCTOR_JOB_FUNCTIONS as readonly string[];

  if (codes.some((code) => doctorCodes.includes(code))) {
    return {
      jobRole: JOB_ROLE.DOCTOR,
      doctorSpecialty: member.specialties[0]?.code ?? "",
      professionalTitle: member.professionalTitle ?? "",
    };
  }
  if (codes.includes(JOB_FUNCTION_CODE.RECEPTIONIST)) {
    return { jobRole: JOB_ROLE.RECEPTIONIST, doctorSpecialty: "", professionalTitle: "" };
  }
  if (codes.includes(JOB_FUNCTION_CODE.ACCOUNTANT)) {
    return { jobRole: JOB_ROLE.ACCOUNTANT, doctorSpecialty: "", professionalTitle: "" };
  }
  return { jobRole: JOB_ROLE.NONE, doctorSpecialty: "", professionalTitle: "" };
}
