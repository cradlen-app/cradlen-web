import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";

type DetailRowProps = {
  label: string;
  value?: string | number | null;
};

type TextFieldProps = {
  defaultValue?: string;
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
};

type SectionPanelProps = {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  icon: ReactNode;
  title: string;
};

type EntitySummaryProps = {
  actions?: ReactNode;
  description?: string;
  icon: ReactNode;
  label?: string;
  meta?: ReactNode;
  title: string;
};

type SettingsDrawerProps = {
  children: ReactNode;
  description: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

type DrawerActionsProps = {
  cancelLabel: string;
  children: ReactNode;
};

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-gray-100 py-3 last:border-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="min-w-0 text-sm text-brand-black">{value || "-"}</dd>
    </div>
  );
}

export function TextField({
  defaultValue,
  id,
  label,
  name,
  placeholder,
  required,
}: TextFieldProps) {
  return (
    <label
      className="flex min-w-0 flex-col gap-1.5 text-sm text-brand-black"
      htmlFor={id}
    >
      <span>{label}</span>
      <input
        aria-required={required}
        className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-black outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10"
        defaultValue={defaultValue}
        id={id}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

export function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
      <p className="text-sm font-medium text-brand-black">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-400">
        {description}
      </p>
    </div>
  );
}

export function SectionPanel({
  action,
  children,
  description,
  icon,
  title,
}: SectionPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-100/60">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/8 text-brand-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-medium text-brand-black">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-gray-400">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EntitySummary({
  actions,
  description,
  icon,
  label,
  meta,
  title,
}: EntitySummaryProps) {
  return (
    <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-primary shadow-sm">
            {icon}
          </div>
          <div className="min-w-0">
            {label && (
              <p className="text-xs font-medium uppercase text-gray-400">
                {label}
              </p>
            )}
            <h3 className="mt-1 truncate text-base font-medium text-brand-black">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-400">{description}</p>
            )}
            {meta && <div className="mt-2 flex flex-wrap gap-2">{meta}</div>}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function SettingsDrawer({
  children,
  description,
  onOpenChange,
  open,
  title,
}: SettingsDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-51 flex w-full max-w-xl flex-col bg-white shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-brand-black">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-brand-black">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function FormGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export function DrawerActions({ cancelLabel, children }: DrawerActionsProps) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-6 flex justify-end gap-2 border-t border-gray-100 bg-white px-5 pt-4">
      <Dialog.Close asChild>
        <Button type="button" variant="outline">
          {cancelLabel}
        </Button>
      </Dialog.Close>
      {children}
    </div>
  );
}
