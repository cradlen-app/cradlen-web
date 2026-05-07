import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import type { ApiStaffSchedule } from "./staff.api.types";

export type StaffRole = (typeof STAFF_ROLE)[keyof typeof STAFF_ROLE];

export type StaffStatus = "available" | "notAvailable";

export type StaffMember = {
  id: string;
  roleId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  handle: string;
  role: StaffRole;
  roles?: StaffRole[];
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
