import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";
import staffEn from "@/core/staff/messages/en.json";
import staffAr from "@/core/staff/messages/ar.json";

/**
 * Statically replicates what `kernel.bootModules() + mergeMessages()` produces
 * at runtime. The test helper stays synchronous (no kernel boot needed) by
 * composing the namespaced slices directly. Keep this in sync with the staff
 * module's `i18nNamespace`.
 */
const TEST_MESSAGES: Record<string, Record<string, unknown>> = {
  en: { ...enMessages, staff: staffEn },
  ar: { ...arMessages, staff: staffAr },
};

type RenderWithIntlOptions = RenderOptions & {
  locale?: string;
  messages?: Record<string, unknown>;
};

export function renderWithIntl(
  ui: ReactElement,
  {
    locale = "en",
    messages = TEST_MESSAGES[locale] ?? TEST_MESSAGES.en,
    ...renderOptions
  }: RenderWithIntlOptions = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    renderOptions,
  );
}
