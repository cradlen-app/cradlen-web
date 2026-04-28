import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";

export function buildRegisterOrganizationRequest(
  registrationToken: string,
  data: Step3Data,
): RegisterOrganizationRequest {
  const organizationSpecialities = data.specialties
    .split(",")
    .map((specialty) => specialty.trim())
    .filter(Boolean);

  return {
    registration_token: registrationToken,
    organization_name: data.organizationName,
    organization_specialities: organizationSpecialities,
    branch_address: data.address,
    branch_city: data.city,
    branch_governorate: data.governorate,
    branch_country: data.country,
    is_clinical: data.isClinical,
    ...(data.isClinical && data.specialty ? { speciality: data.specialty } : {}),
    ...(data.jobTitle ? { job_title: data.jobTitle } : {}),
  };
}
