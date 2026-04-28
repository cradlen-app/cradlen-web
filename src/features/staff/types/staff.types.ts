import type { ApiStaffSchedule } from "./staff.api.types";

export type StaffRole = "owner" | "doctor" | "reception" | "unknown";

export type StaffStatus = "available" | "notAvailable";

export type StaffMember = {
  id: string;
  roleId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  handle: string;
  role: StaffRole;
  jobTitle: string;
  specialty: string;
  phone: string;
  status: StaffStatus;
  address?: string;
  schedule?: ApiStaffSchedule;
  workSchedule?: string;
};

export type StaffFilter = "all" | StaffRole;

export type StaffRoleFilter = {
  id: string;
  name: string;
  role: StaffRole;
};
