"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

type RoleSelectorProps = {
  heading: string;
  ownerLabel: string;
  ownerDoctorLabel: string;
  registration: UseFormRegisterReturn;
  error?: string;
};

export function RoleSelector({
  heading,
  ownerLabel,
  ownerDoctorLabel,
  registration,
  error,
}: RoleSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="border-b border-gray-100 pb-2 text-sm font-medium text-brand-black">
        {heading}
      </h3>

      <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-brand-black">
        <input
          type="radio"
          value="owner"
          {...registration}
          className="size-4 cursor-pointer rounded border-gray-300 accent-brand-primary"
        />
        <span>{ownerLabel}</span>
      </label>
      <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-brand-black">
        <input
          type="radio"
          value="owner_doctor"
          {...registration}
          className="size-4 cursor-pointer rounded border-gray-300 accent-brand-primary"
        />
        <span>{ownerDoctorLabel}</span>
      </label>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
