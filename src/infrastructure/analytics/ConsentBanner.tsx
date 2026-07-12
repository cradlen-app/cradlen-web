"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { analyticsConfigured } from "@/infrastructure/config/analytics-config";
import { getConsent, setConsent } from "./consent";

/**
 * One-time GDPR consent banner. Renders only when analytics is configured and
 * the user has not chosen yet. Localized + RTL-aware via logical utilities.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (analyticsConfigured && getConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (choice: "granted" | "denied") => {
    setConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t("message")}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        {t("message")}{" "}
        <Link href="/privacy-policy" className="underline">
          {t("learnMore")}
        </Link>
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => choose("denied")}>
          {t("decline")}
        </Button>
        <Button size="sm" onClick={() => choose("granted")}>
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
