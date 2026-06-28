"use client";

import type { ReactNode } from "react";
import { cn } from "@/common/utils/utils";
import type { CurrentUser, UserProfile } from "@/common/types/user.types";
import type { OrganizationBranch } from "../lib/settings.api";
import type { DrawerKey } from "./settings.types";
import type { SettingsT } from "./settings.utils";

/** Common props shared by the settings drawer forms (profile / organization / branch). */
export type SettingsFormProps = {
  activeDrawer: DrawerKey;
  branches?: OrganizationBranch[];
  branchId?: string;
  cancelLabel: string;
  onDone: () => void;
  profile?: UserProfile;
  t: SettingsT;
  user: CurrentUser;
};

export function getOrganizationSpecialtyCodes(profile?: UserProfile): string[] {
  const list = profile?.organization?.specialties;
  if (!list?.length) return [];
  return list.map((s) => (typeof s === "string" ? s : s.code));
}

export function fieldClass(error?: unknown) {
  return cn(
    "h-10 rounded-lg border bg-white px-3 text-sm text-brand-black outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10",
    error ? "border-red-300" : "border-gray-200",
  );
}

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1 text-sm text-brand-black"
    >
      <span>{children}</span>
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}
