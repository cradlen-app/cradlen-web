"use client";

import type { UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { Step3Data } from "../types/sign-up.types";

type DoctorFieldsProps = {
  isVisible: boolean;
  register: UseFormRegister<Step3Data>;
  inputClassName: string;
  specialtyLabel: string;
  specialtyPlaceholder: string;
  jobTitleLabel: string;
  jobTitlePlaceholder: string;
};

export function DoctorFields({
  isVisible,
  register,
  inputClassName,
  specialtyLabel,
  specialtyPlaceholder,
  jobTitleLabel,
  jobTitlePlaceholder,
}: DoctorFieldsProps) {
  const hiddenTabIndex = isVisible ? undefined : -1;

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out",
        isVisible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0">
        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="specialty" className="text-sm text-brand-black">
              {specialtyLabel}
            </label>
            <input
              id="specialty"
              type="text"
              placeholder={specialtyPlaceholder}
              tabIndex={hiddenTabIndex}
              {...register("specialty")}
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="jobTitle" className="text-sm text-brand-black">
              {jobTitleLabel}
            </label>
            <input
              id="jobTitle"
              type="text"
              placeholder={jobTitlePlaceholder}
              tabIndex={hiddenTabIndex}
              {...register("jobTitle")}
              className={inputClassName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
