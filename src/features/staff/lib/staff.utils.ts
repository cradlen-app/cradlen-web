import type { ApiStaffDay, ApiStaffMember, ApiStaffSchedule } from "../types/staff.api.types";
import type { StaffFilter, StaffMember, StaffRole } from "../types/staff.types";

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_NAMES: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu",
  FRI: "Fri", SAT: "Sat", SUN: "Sun",
};

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

function formatSchedule(schedule?: ApiStaffSchedule): string | undefined {
  if (!schedule?.days?.length) return undefined;
  const sorted = [...schedule.days].sort(
    (a: ApiStaffDay, b: ApiStaffDay) =>
      DAY_ORDER.indexOf(a.day_of_week as never) - DAY_ORDER.indexOf(b.day_of_week as never),
  );
  return sorted
    .map((day) => {
      const shifts = day.shifts
        .map((s) => `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`)
        .join(", ");
      return `${DAY_NAMES[day.day_of_week]}: ${shifts}`;
    })
    .join("\n");
}

function mapApiRole(apiMember: ApiStaffMember): StaffRole {
  const name = apiMember.role?.name;
  if (name === "owner") return "owner";
  if (name === "receptionist") return "reception";
  if (name === "doctor") return "doctor";
  return "doctor";
}

export function mapApiStaffToMember(api: ApiStaffMember): StaffMember {
  return {
    id: api.id,
    firstName: api.user?.first_name ?? "",
    lastName: api.user?.last_name ?? "",
    handle: api.user?.email ? `@${api.user.email.split("@")[0]}` : `@${api.user_id.slice(0, 8)}`,
    role: mapApiRole(api),
    jobTitle: api.job_title ?? "",
    specialty: api.specialty ?? "",
    phone: api.user?.phone ?? "-",
    status: "available",
    workSchedule: formatSchedule(api.schedule),
  };
}

export const staffFilters: StaffFilter[] = ["all", "doctor", "reception"];

export function getStaffFullName(member: Pick<StaffMember, "firstName" | "lastName">) {
  return `${member.firstName} ${member.lastName}`.trim();
}

export function getStaffInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getRoleTranslationKey(role: StaffRole) {
  return `roles.${role}` as const;
}

export function matchesStaffFilter(member: StaffMember, filter: StaffFilter) {
  return filter === "all" || member.role === filter;
}

export function matchesStaffSearch(member: StaffMember, search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    getStaffFullName(member),
    member.handle,
    member.jobTitle,
    member.specialty,
    member.phone,
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
}
