export type StaffRole = "owner" | "doctor" | "reception";

export type StaffStatus = "available" | "notAvailable";

export type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  role: StaffRole;
  jobTitle: string;
  specialty: string;
  phone: string;
  status: StaffStatus;
  address?: string;
  workSchedule?: string;
};

export type StaffFilter = "all" | "doctor" | "reception";
