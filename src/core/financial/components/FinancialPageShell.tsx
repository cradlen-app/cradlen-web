"use client";

import type { ReactNode } from "react";

type FinancialPageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Shared header + content frame for the financial section pages so Services,
 * Invoice Search, Cash Sessions and Reports stay visually consistent.
 */
export function FinancialPageShell({
  title,
  subtitle,
  actions,
  children,
}: FinancialPageShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-brand-black">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="flex-1 overflow-auto px-4 py-4 sm:px-6">{children}</div>
    </div>
  );
}
