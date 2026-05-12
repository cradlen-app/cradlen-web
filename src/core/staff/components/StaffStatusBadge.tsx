import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { StaffStatus } from "../types/staff.types";

type StaffStatusBadgeProps = {
  status: StaffStatus;
  variant?: "dot" | "pill";
};

export function StaffStatusBadge({ status, variant = "dot" }: StaffStatusBadgeProps) {
  const t = useTranslations("staff.status");
  const isAvailable = status === "available";

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
          isAvailable
            ? "bg-emerald-500/20 text-emerald-100"
            : "bg-red-500/20 text-red-200",
        )}
      >
        <StatusDot status={status} className={isAvailable ? "bg-emerald-400" : "bg-red-400"} />
        {isAvailable ? t("available") : t("notAvailable")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot status={status} />
      <span
        className={cn(
          "text-xs font-medium",
          isAvailable ? "text-green-600" : "text-red-500",
        )}
      >
        {isAvailable ? t("available") : t("notAvailable")}
      </span>
    </span>
  );
}

function StatusDot({ status, className }: StaffStatusBadgeProps & { className?: string }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        status === "available" ? "bg-green-500" : "bg-red-500",
        className,
      )}
    />
  );
}
