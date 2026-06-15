import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";
import { OWNER_JOB_ROLE, deriveDoctorJobFunction } from "./auth.constants";

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

  // Owner's own job function. DOCTOR fans out to a clinical code derived from
  // the chosen specialty (which also drives examination templates); the other
  // roles map to a single code; NONE adds nothing (purely administrative owner).
  switch (data.jobRole) {
    case OWNER_JOB_ROLE.DOCTOR: {
      if (data.doctorSpecialty) {
        payload.practitioner_specialties = [data.doctorSpecialty];
        payload.job_function_codes = [
          deriveDoctorJobFunction(data.doctorSpecialty),
        ];
      }
      const title = data.professionalTitle?.trim();
      if (title) payload.professional_title = title;
      break;
    }
    case OWNER_JOB_ROLE.RECEPTIONIST:
      payload.job_function_codes = ["RECEPTIONIST"];
      break;
    case OWNER_JOB_ROLE.ACCOUNTANT:
      payload.job_function_codes = ["ACCOUNTANT"];
      break;
    case OWNER_JOB_ROLE.NONE:
      break;
  }

  return payload;
}
