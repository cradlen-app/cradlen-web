import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";
import { JOB_FUNCTION_CODE, JOB_ROLE } from "./auth.constants";

export function buildRegisterOrganizationRequest(
  data: Step3Data,
): RegisterOrganizationRequest {
  const payload: RegisterOrganizationRequest = {
    organization_name: data.organizationName,
    specialties: data.specialties,
    executive_title: data.executiveTitle,
    branch_name: data.branchName,
    branch_address: data.address,
    branch_city: data.city,
    branch_governorate: data.governorate,
  };

  if (data.country) payload.branch_country = data.country;

  // Owner's own job function. DOCTOR maps to the single DOCTOR job function plus
  // the chosen specialty (which drives examination templates); the other roles
  // map to a single code; NONE adds nothing (purely administrative owner).
  switch (data.jobRole) {
    case JOB_ROLE.DOCTOR: {
      if (data.doctorSpecialty) {
        payload.practitioner_specialty_code = data.doctorSpecialty;
        if (data.doctorSubspecialties.length) {
          payload.practitioner_subspecialty_codes = data.doctorSubspecialties;
        }
        payload.job_function_code = JOB_FUNCTION_CODE.DOCTOR;
      }
      const title = data.professionalTitle?.trim();
      if (title) payload.professional_title = title;
      break;
    }
    case JOB_ROLE.RECEPTIONIST:
      payload.job_function_code = JOB_FUNCTION_CODE.RECEPTIONIST;
      break;
    case JOB_ROLE.ACCOUNTANT:
      payload.job_function_code = JOB_FUNCTION_CODE.ACCOUNTANT;
      break;
    case JOB_ROLE.NONE:
      break;
  }

  return payload;
}
