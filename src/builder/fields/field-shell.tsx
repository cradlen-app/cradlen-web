"use client";

import type { ReactNode } from "react";

export const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50";

interface FieldShellProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ label, required, error, children, className }: FieldShellProps) {
  return (
    <label className={className ?? "block"}>
      <span className="text-xs font-medium text-brand-black">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
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
