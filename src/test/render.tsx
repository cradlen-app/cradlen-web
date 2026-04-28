import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";

type RenderWithIntlOptions = RenderOptions & {
  locale?: string;
  messages?: Record<string, unknown>;
};

export function renderWithIntl(
  ui: ReactElement,
  {
    locale = "en",
    messages = enMessages,
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
