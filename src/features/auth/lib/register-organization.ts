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
    branch_name: data.branchName,
    branch_address: data.address,
    branch_city: data.city,
    branch_governorate: data.governorate,
  };

  if (data.country) payload.branch_country = data.country;

  return payload;
}
