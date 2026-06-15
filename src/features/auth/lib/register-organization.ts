import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";

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

  // Practitioner (owner-is-also-a-doctor) fields only when opted in.
  if (data.isPractitioner) {
    if (data.practitionerSpecialties.length > 0) {
      payload.practitioner_specialties = data.practitionerSpecialties;
    }
    if (data.jobFunction) {
      payload.job_function_codes = [data.jobFunction];
    }
    const title = data.professionalTitle?.trim();
    if (title) payload.professional_title = title;
  }

  return payload;
}
