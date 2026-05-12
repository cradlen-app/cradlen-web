import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  PAUSED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-600",
};

type JourneyStatusBadgeProps = {
  status: string;
};

export function JourneyStatusBadge({ status }: JourneyStatusBadgeProps) {
  const t = useTranslations("patients.journeyStatus");
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500";

  let label: string;
  try {
    label = t(status as Parameters<typeof t>[0]);
  } catch {
    label = status;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
      )}
    >
      {label}
    </span>
  );
}
