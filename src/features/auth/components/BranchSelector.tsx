import { GitBranch } from "lucide-react";
import { cn } from "@/common/utils/utils";

type BranchSelectorItem = {
  id: string;
  isMain?: boolean;
  label: string;
};

type BranchSelectorProps = {
  branches: BranchSelectorItem[];
  mainBranchLabel: string;
  onChange: (branchId: string) => void;
  selectedBranchId: string | null;
  title: string;
};

export function BranchSelector({
  branches,
  mainBranchLabel,
  onChange,
  selectedBranchId,
  title,
}: BranchSelectorProps) {
  return (
    <section className="mt-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-black">
        <GitBranch className="size-4 text-brand-primary" />
        {title}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {branches.map((branch) => {
          const isSelected = selectedBranchId === branch.id;

          return (
            <label
              key={branch.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-brand-black transition-all duration-200",
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/10"
                  : "border-gray-100 hover:border-brand-primary/50",
              )}
            >
              <input
                type="radio"
                checked={isSelected}
                onChange={() => onChange(branch.id)}
                className="accent-brand-primary"
              />
              <span className="min-w-0 flex-1 truncate">{branch.label}</span>
              {branch.isMain && (
                <span className="shrink-0 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary">
                  {mainBranchLabel}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}
