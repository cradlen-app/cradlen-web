import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";

export function buildRegisterOrganizationRequest(
  data: Step3Data,
): RegisterOrganizationRequest {
  const accountSpecialities = data.specialties
    .split(",")
    .map((specialty) => specialty.trim())
    .filter(Boolean);
  const isClinical = data.isClinical;
  const specialty = data.specialty?.trim();
  const jobTitle = data.jobTitle?.trim();

  const payload: RegisterOrganizationRequest = {
    account_name: data.accountName,
    specialties: accountSpecialities,
    branch_name: data.branchName,
    branch_address: data.address,
    branch_city: data.city,
    branch_governorate: data.governorate,
    roles: isClinical ? ["OWNER", "DOCTOR"] : ["OWNER"],
  };

  if (data.country) payload.branch_country = data.country;
  if (isClinical && specialty) payload.specialty = specialty;
  if (isClinical && jobTitle) payload.job_title = jobTitle;

  return payload;
}
