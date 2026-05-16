"use client";

import { Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  section: "history" | "examination";
};

export function ComingSoonPlaceholder({ section }: Props) {
  const t = useTranslations("visits.workspace.comingSoon");
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary"
        >
          <Hourglass className="size-5" />
        </span>
        <h3 className="text-sm font-semibold text-brand-black">
          {t(`${section}.title`)}
        </h3>
        <p className="text-xs text-gray-500">{t(`${section}.body`)}</p>
      </div>
    </div>
  );
}
