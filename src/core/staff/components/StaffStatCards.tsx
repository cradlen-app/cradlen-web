"use client";

import {
  Crown,
  Stethoscope,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  StatTrendCard,
  StatTrendCardSkeleton,
} from "@/components/common/StatTrendCard";
import { useStaffStats } from "../hooks/useStaffStats";

type Props = {
  organizationId?: string;
  branchId?: string;
};

/** Icon hint per known role code; unknown/new codes fall back to a generic icon. */
const ROLE_ICONS: Record<string, LucideIcon> = {
  OWNER: Crown,
  BRANCH_MANAGER: UserCog,
  STAFF: Users,
  EXTERNAL: UserPlus,
};

function iconForRole(roleCode: string): LucideIcon {
  return ROLE_ICONS[roleCode] ?? UserRound;
}

export function StaffStatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatTrendCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Analytics cards above the staff table: a total plus one card per role present
 * in the data (labels prefer the localized staff role names, falling back to the
 * API role name) plus a clinical subtotal, each with a month-over-month trend.
 */
export function StaffStatCards({ organizationId, branchId }: Props) {
  const t = useTranslations("staff");
  const { data, isLoading } = useStaffStats(organizationId, branchId);

  if (isLoading) return <StaffStatCardsSkeleton />;
  if (!data) return null;

  const roleLabel = (roleCode: string, fallback: string) =>
    t.has(`apiRoles.${roleCode}`) ? t(`apiRoles.${roleCode}`) : fallback;

  const vsLastMonth = t("stats.vsLastMonth");
  const noPrior = t("stats.noPrior");

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      <StatTrendCard
        icon={Users}
        label={t("stats.total")}
        metric={data.total}
        accent
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
      {data.by_role.map((r) => (
        <StatTrendCard
          key={r.role_code}
          icon={iconForRole(r.role_code)}
          label={roleLabel(r.role_code, r.role_name)}
          metric={r}
          vsLastMonthLabel={vsLastMonth}
          noPriorLabel={noPrior}
        />
      ))}
      <StatTrendCard
        icon={Stethoscope}
        label={t("stats.clinical")}
        metric={data.clinical}
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
    </div>
  );
}
