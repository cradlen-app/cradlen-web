import type {
  ApiStaffDay,
  ApiStaffMember,
  ApiStaffRole,
  ApiStaffSchedule,
} from "../types/staff.api.types";
import type {
  StaffFilter,
  StaffMember,
  StaffRole,
  StaffRoleFilter,
  StaffStatus,
} from "../types/staff.types";

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

const DAY_MAP: Record<number, ApiStaffDay["day_of_week"]> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export function computeStaffStatus(
  schedule: ApiStaffSchedule | undefined,
  now = new Date(),
): StaffStatus {
  if (!schedule?.days?.length) return "notAvailable";

  const todayKey = DAY_MAP[now.getDay()];
  const todaySchedule = schedule.days.find((d) => d.day_of_week === todayKey);
  if (!todaySchedule?.shifts?.length) return "notAvailable";

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const inShift = todaySchedule.shifts.some((shift) => {
    const [sh, sm] = shift.start_time.split(":").map(Number);
    const [eh, em] = shift.end_time.split(":").map(Number);
    return currentMinutes >= sh * 60 + sm && currentMinutes < eh * 60 + em;
  });

  return inShift ? "available" : "notAvailable";
}
const DAY_NAMES: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
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
      DAY_ORDER.indexOf(a.day_of_week as never) -
      DAY_ORDER.indexOf(b.day_of_week as never),
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

export function normalizeApiRoleName(name?: string): StaffRole {
  if (name === "owner") return "owner";
  if (name === "receptionist" || name === "reception") return "reception";
  if (name === "doctor") return "doctor";
  return "doctor";
}

function mapApiRole(apiMember: ApiStaffMember): StaffRole {
  return normalizeApiRoleName(apiMember.role?.name);
}

export function mapApiStaffToMember(api: ApiStaffMember): StaffMember {
  return {
    id: api.id,
    roleId: api.role_id,
    firstName: api.user?.first_name ?? "",
    lastName: api.user?.last_name ?? "",
    handle: api.user?.email
      ? `@${api.user.email.split("@")[0]}`
      : `@${api.user_id.slice(0, 8)}`,
    role: mapApiRole(api),
    jobTitle: api.job_title ?? "",
    specialty: api.specialty ?? "",
    phone: api.user?.phone_number ?? api.user?.phone ?? "-",
    status: computeStaffStatus(api.schedule),
    workSchedule: formatSchedule(api.schedule),
  };
}

export function mapApiRoleToFilter(role: ApiStaffRole): StaffRoleFilter {
  return {
    id: role.id,
    name: role.name,
    role: normalizeApiRoleName(role.name),
  };
}

export function getStaffFullName(
  member: Pick<StaffMember, "firstName" | "lastName">,
) {
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
  return filter === "all" || member.roleId === filter || member.role === filter;
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
