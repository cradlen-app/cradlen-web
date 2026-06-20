import { cn } from "@/common/utils/utils";

type Props = {
  no?: string;
  children: React.ReactNode;
  className?: string;
};

/** "02 —— WHY JOURNEYS" style eyebrow used across marketing sections. */
export default function SectionLabel({ no, children, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary",
        className,
      )}
    >
      {no ? <span>{no}</span> : null}
      <span className="h-px w-7 bg-brand-primary/40" />
      <span>{children}</span>
    </div>
  );
}
