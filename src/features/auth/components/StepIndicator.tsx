"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";

type StepIndicatorProps = {
  currentStep: 1 | 2 | 3;
};

const STEPS = [
  { labelKey: "step1Label" },
  { labelKey: "step2Label" },
  { labelKey: "step3Label" },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const t = useTranslations("auth.signUp");

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const stepNumber = i + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "size-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                    isActive || isCompleted
                      ? "bg-brand-primary border-brand-primary text-white"
                      : "bg-white border-gray-300 text-gray-400",
                  )}
                >
                  {stepNumber}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center whitespace-nowrap",
                    isActive || isCompleted
                      ? "text-brand-black"
                      : "text-gray-400",
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3 mb-6 transition-colors",
                    currentStep > stepNumber
                      ? "bg-brand-primary"
                      : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
