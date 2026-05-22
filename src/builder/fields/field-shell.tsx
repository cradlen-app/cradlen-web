"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/common/utils/utils";

export const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50";

interface FieldShellProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  flagged?: boolean;
  inline?: boolean;
}

export function FieldShell({
  label,
  required,
  error,
  children,
  className,
  flagged,
  inline,
}: FieldShellProps) {
  const labelContent = (
    <span className="text-xs font-medium text-brand-black">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
      {flagged && (
        <AlertTriangle
          size={10}
          className="inline ml-1 text-red-600 align-middle"
          aria-label="Flagged"
        />
      )}
    </span>
  );

  if (inline) {
    return (
      // inline uses a div (not label) — each checkbox option has its own inner label
      <div className={cn("flex flex-row items-start gap-4", className)}>
        <span className="flex-shrink-0 min-w-[120px]">{labelContent}</span>
        <div className="flex-1 flex flex-col">
          {children}
          {error ? <p className="pt-1 text-[11px] text-red-500">{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <label className={cn("block", className)}>
      {labelContent}
      {children}
      {error ? <p className="pt-1 text-[11px] text-red-500">{error}</p> : null}
    </label>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <p className="shrink-0 text-xs font-medium text-gray-400">{title}</p>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
