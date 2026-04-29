import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";

export function buildRegisterOrganizationRequest(
  email: string,
  data: Step3Data,
): RegisterOrganizationRequest {
  const accountSpecialities = data.specialties
    .split(",")
    .map((specialty) => specialty.trim())
    .filter(Boolean);
  const isClinical = data.role === "owner_doctor";
  const specialty = data.specialty?.trim();
  const jobTitle = data.jobTitle?.trim();

  const payload: RegisterOrganizationRequest = {
    email,
    account_name: data.accountName,
    account_specialities: accountSpecialities,
    branch_name: data.accountName,
    branch_address: data.address,
    branch_city: data.city,
    branch_governorate: data.governorate,
    branch_country: data.country,
    roles: isClinical ? ["OWNER", "DOCTOR"] : ["OWNER"],
    is_clinical: isClinical,
  };

  if (isClinical && specialty) payload.specialty = specialty;
  if (isClinical && jobTitle) payload.job_title = jobTitle;

  return payload;
}
