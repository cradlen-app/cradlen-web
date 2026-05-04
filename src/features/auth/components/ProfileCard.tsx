import { Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileCardProps = {
  organizationName: string;
  branchCountLabel: string;
  isSelected: boolean;
  onSelect: () => void;
  rolesLabel: string;
};

export function ProfileCard({
  organizationName,
  branchCountLabel,
  isSelected,
  onSelect,
  rolesLabel,
}: ProfileCardProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        "flex min-h-32 flex-col items-start gap-4 rounded-xl border bg-white p-4 text-start shadow-sm outline-none transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand-primary/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-primary/25",
        isSelected
          ? "border-brand-primary ring-2 ring-brand-primary/15"
          : "border-gray-100",
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Building2 className="size-5" />
        </span>
        {isSelected && <Check className="size-5 text-brand-primary" />}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-black">
          {organizationName}
        </p>
        <p className="mt-1 text-xs text-gray-500">{rolesLabel}</p>
      </div>

      <span className="mt-auto rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
        {branchCountLabel}
      </span>
    </button>
  );
}
