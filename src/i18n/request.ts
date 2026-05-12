import { getRequestConfig } from "next-intl/server";

import type { Locale } from "@/common/kernel-contracts";
import { mergeMessages } from "@/infrastructure/i18n/mergeMessages";
import { bootModules } from "@/kernel";

import { routing } from "./routing";

async function loadBaseMessages(locale: string) {
  switch (locale) {
    case "ar":
      return (await import("../messages/ar.json")).default;
    default:
      return (await import("../messages/en.json")).default;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const registry = bootModules();
  const base = await loadBaseMessages(locale);
  const messages = await mergeMessages(locale as Locale, base, registry);

  return { locale, messages };
});
