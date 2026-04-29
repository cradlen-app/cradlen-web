import type { ReactNode } from "react";

type SelectionLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  subtitle?: string;
  title: string;
};

export function SelectionLayout({
  actions,
  children,
  subtitle,
  title,
}: SelectionLayoutProps) {
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-brand-black">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="transition-all duration-200 ease-out">{children}</div>

      {actions && <div className="mt-5">{actions}</div>}
    </div>
  );
}
