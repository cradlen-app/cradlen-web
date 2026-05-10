import { STAFF_API_ROLE, type StaffApiRole } from "@/features/auth/lib/auth.constants";
import type {
  ApiStaffBranchSchedule,
  ApiStaffDay,
  ApiStaffMember,
  ApiStaffRole,
  ApiStaffSchedule,
} from "../types/staff.api.types";
import type {
  StaffFilter,
  StaffMember,
  StaffRoleOption,
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

  const days: Array<{
    day_of_week: ApiStaffDay["day_of_week"];
    shifts: Array<{ start_time: string; end_time: string }>;
  }> = Array.isArray(schedule)
    ? schedule.flatMap((b) => b.days)
    : (schedule.days ?? []);

  if (!days.length) return "notAvailable";

  const todayKey = DAY_MAP[now.getDay()];
  const todaySchedule = days.find((d) => d.day_of_week === todayKey);
  if (!todaySchedule?.shifts?.length) return "notAvailable";

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return todaySchedule.shifts.some((shift) => {
    const [sh, sm] = shift.start_time.split(":").map(Number);
    const [eh, em] = shift.end_time.split(":").map(Number);
    return currentMinutes >= sh * 60 + sm && currentMinutes < eh * 60 + em;
  })
    ? "available"
    : "notAvailable";
}

function getDayName(dayCode: string, locale: string): string {
  // Jan 4 2026 is a Sunday.
  const dayIndex = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].indexOf(dayCode);
  const date = new Date(2026, 0, 4 + dayIndex);
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}

function formatTime(time: string, locale: string): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatBranchSchedule(
  schedule: ApiStaffBranchSchedule[] | undefined,
  locale: string,
): string | undefined {
  const days = schedule?.flatMap((b) => b.days) ?? [];
  if (!days.length) return undefined;
  const sorted = [...days].sort(
    (a, b) =>
      DAY_ORDER.indexOf(a.day_of_week as never) -
      DAY_ORDER.indexOf(b.day_of_week as never),
  );
  return sorted
    .map((day) => {
      const shifts = day.shifts
        .map((s) => `${formatTime(s.start_time, locale)} - ${formatTime(s.end_time, locale)}`)
        .join(", ");
      return `${getDayName(day.day_of_week, locale)}: ${shifts}`;
    })
    .join("\n");
}

const KNOWN_API_ROLES = new Set<string>(Object.values(STAFF_API_ROLE));

export function normalizeApiRoleName(name?: string): StaffApiRole | "UNKNOWN" {
  if (!name) return "UNKNOWN";
  const upper = name.toUpperCase();
  if (KNOWN_API_ROLES.has(upper)) return upper as StaffApiRole;
  return "UNKNOWN";
}

export function mapApiStaffToMember(api: ApiStaffMember, locale: string): StaffMember {
  const roles = (api.roles ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    role: normalizeApiRoleName(r.name),
  }));
  const primary = roles[0]?.role ?? "UNKNOWN";
  const email = api.email;
  const id = api.staff_id ?? api.profile_id ?? api.user_id ?? "";

  return {
    id,
    firstName: api.first_name,
    lastName: api.last_name,
    email,
    handle: email
      ? `@${email.split("@")[0]}`
      : api.user_id
        ? `@${api.user_id.slice(0, 8)}`
        : "@",
    phone: api.phone_number ?? "-",
    status: computeStaffStatus(api.schedule),
    role: primary,
    roles,
    branches: api.branches ?? [],
    jobFunctions: api.job_functions ?? [],
    specialties: api.specialties ?? [],
    executiveTitle: api.executive_title ?? null,
    engagementType: api.engagement_type ?? null,
    schedule: api.schedule,
    workSchedule: formatBranchSchedule(api.schedule, locale),
    isClinical: (api.job_functions ?? []).some((fn) => fn.is_clinical),
  };
}

export function mapApiRoleToFilter(role: ApiStaffRole): StaffRoleOption {
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

export function getRoleTranslationKey(role: StaffApiRole | "UNKNOWN") {
  return `apiRoles.${role}` as const;
}

export function matchesStaffFilter(member: StaffMember, filter: StaffFilter) {
  if (filter === "all") return true;
  return member.roles.some((r) => r.role === filter);
}

export function matchesStaffSearch(member: StaffMember, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const haystacks: string[] = [
    getStaffFullName(member),
    member.handle,
    member.phone,
    ...member.specialties.map((s) => s.name),
    ...member.jobFunctions.map((j) => j.name),
  ].filter(Boolean);

  return haystacks.some((value) => value.toLowerCase().includes(query));
}

export function getStaffJobFunctionsLabel(member: StaffMember): string {
  return member.jobFunctions.map((fn) => fn.name).join(", ");
}

export function getStaffSpecialtiesLabel(member: StaffMember): string {
  return member.specialties.map((s) => s.name).join(", ");
}
