"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";

export default function CreateOrganizationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[CreateOrganization error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center px-6 py-4 border-b border-gray-100">
        <Image src={Logo} alt="Cradlen" loading="eager" className="w-auto h-7" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl flex flex-col items-center gap-6 text-center">
          <Image src={LogoIcon} alt="" loading="eager" width={64} height={64} />
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-brand-black">{t("title")}</h1>
            <p className="text-sm text-gray-500 max-w-sm">{t("description")}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
          >
            {t("retry")}
          </button>
        </div>
      </main>
    </div>
  );
}
