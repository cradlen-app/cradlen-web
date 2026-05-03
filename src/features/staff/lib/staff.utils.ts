import type {
  ApiStaffBranchSchedule,
  ApiStaffDay,
  ApiStaffMember,
  ApiStaffRole,
  ApiStaffSchedule,
  NewApiStaffMember,
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
  schedule: ApiStaffSchedule | ApiStaffBranchSchedule[] | undefined,
  now = new Date(),
): StaffStatus {
  if (!schedule) return "notAvailable";

  // Normalize both formats into a flat days array
  const days: Array<{ day_of_week: ApiStaffDay["day_of_week"]; shifts: Array<{ start_time: string; end_time: string }> }> =
    Array.isArray(schedule)
      ? schedule.flatMap((b) => b.days)
      : schedule.days ?? [];

  if (!days.length) return "notAvailable";

  const todayKey = DAY_MAP[now.getDay()];
  const todaySchedule = days.find((d) => d.day_of_week === todayKey);
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

function formatBranchSchedule(schedule: ApiStaffBranchSchedule[]): string | undefined {
  const days = schedule.flatMap((b) => b.days);
  if (!days.length) return undefined;
  const sorted = [...days].sort(
    (a, b) =>
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

function formatLegacySchedule(schedule?: ApiStaffSchedule): string | undefined {
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
  const normalized = name?.toLowerCase();
  if (normalized === "owner") return "owner";
  if (normalized === "receptionist" || normalized === "reception") return "reception";
  if (normalized === "doctor") return "doctor";
  return "unknown";
}

// Maps the new /accounts/:accountId/staff response shape
export function mapApiStaffToMember(api: NewApiStaffMember): StaffMember {
  const primaryRole = api.roles?.[0];
  const role = normalizeApiRoleName(primaryRole?.name);

  return {
    id: api.profile_id,
    roleId: primaryRole?.id,
    firstName: api.first_name,
    lastName: api.last_name,
    email: api.email,
    handle: api.email
      ? `@${api.email.split("@")[0]}`
      : `@${api.user_id.slice(0, 8)}`,
    role,
    roles: api.roles?.map((r) => normalizeApiRoleName(r.name)) ?? [],
    jobTitle: api.job_title ?? "",
    specialty: api.specialty ?? "",
    phone: api.phone_number ?? "-",
    status: computeStaffStatus(api.schedule),
    schedule: api.schedule?.length
      ? { days: api.schedule.flatMap((b) => b.days) as ApiStaffDay[] }
      : undefined,
    workSchedule: api.schedule?.length ? formatBranchSchedule(api.schedule) : undefined,
  };
}

// Legacy mapper for old /staff/:id response shape (used by updateStaff/deactivateStaff)
export function mapLegacyApiStaffToMember(api: ApiStaffMember): StaffMember {
  const legacySchedule = Array.isArray(api.schedule) ? undefined : (api.schedule as ApiStaffSchedule | undefined);
  return {
    id: api.id ?? api.profile_id,
    roleId: api.role_id ?? api.roles?.[0]?.id,
    firstName: api.user?.first_name ?? api.first_name,
    lastName: api.user?.last_name ?? api.last_name,
    email: api.user?.email ?? api.email,
    handle: (api.user?.email ?? api.email)
      ? `@${(api.user?.email ?? api.email)!.split("@")[0]}`
      : `@${api.user_id.slice(0, 8)}`,
    role: normalizeApiRoleName(api.role?.name ?? api.roles?.[0]?.name),
    jobTitle: api.job_title ?? "",
    specialty: api.specialty ?? "",
    phone: api.user?.phone_number ?? api.user?.phone ?? api.phone_number ?? "-",
    status: computeStaffStatus(legacySchedule),
    schedule: legacySchedule,
    workSchedule: formatLegacySchedule(legacySchedule),
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
