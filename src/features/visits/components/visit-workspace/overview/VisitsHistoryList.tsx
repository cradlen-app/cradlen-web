"use client";

import { Calendar, Clock, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type VisitHistoryType = "VISIT" | "FOLLOW_UP";

type MockVisitHistoryEntry = {
  id: string;
  date: string;
  type: VisitHistoryType;
  diagnoses: string[];
  medications: string[];
  investigations?: string[];
};

const MOCK_HISTORY: MockVisitHistoryEntry[] = [
  {
    id: "mock-1",
    date: "2025-09-30",
    type: "FOLLOW_UP",
    diagnoses: [
      "Hypertension (Uncontrolled)",
      "Elevated Blood Sugar (Needs monitoring)",
    ],
    medications: ["Amlodipine 5 mg", "Metformin 500 mg"],
    investigations: ["CBC Test"],
  },
  {
    id: "mock-2",
    date: "2025-08-10",
    type: "VISIT",
    diagnoses: [
      "Hypertension (Uncontrolled)",
      "Elevated Blood Sugar (Needs monitoring)",
    ],
    medications: ["Amlodipine 5 mg", "Metformin 500 mg"],
  },
];

function formatDate(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // Force DMY ordering for English so we get "30 Sep 2025" rather than "Sep 30, 2025".
  const formatLocale = locale.startsWith("en") ? "en-GB" : locale;
  return new Intl.DateTimeFormat(formatLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function VisitsHistoryList() {
  const t = useTranslations("visits.workspace.history");
  const locale = useLocale();

  return (
    <section>
      <header className="flex items-center gap-2">
        <Clock className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      <ol className="mt-6 space-y-0">
        {MOCK_HISTORY.map((entry, index) => (
          <li key={entry.id} className="flex items-stretch gap-4">
            <div className="flex w-24 flex-none flex-col items-center">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600 whitespace-nowrap">
                <span>{formatDate(entry.date, locale)}</span>
              </div>
              {index < MOCK_HISTORY.length - 1 && (
                <div
                  className="mt-2 w-px flex-1 bg-gray-200"
                  aria-hidden="true"
                />
              )}
            </div>

            <div
              className={
                index < MOCK_HISTORY.length - 1 ? "flex-1 pb-6" : "flex-1"
              }
            >
              <article className="rounded-xl border border-gray-100 p-4">
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-700">
                    {t(`typeLabel.${entry.type}`)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className="size-1.5 rounded-full bg-emerald-500"
                      aria-hidden="true"
                    />
                    {t("statusNormal")}
                  </span>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary/80"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    {t("visitDetails")}
                  </a>
                </header>

                <Section title={t("diagnosis")}>
                  {entry.diagnoses.map((d) => (
                    <p key={d} className="text-xs text-gray-700">
                      {d}
                    </p>
                  ))}
                </Section>

                <Section title={t("medications")}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {entry.medications.map((m) => (
                      <span key={m} className="text-xs text-gray-700">
                        {m}
                      </span>
                    ))}
                  </div>
                </Section>

                {entry.investigations?.length ? (
                  <Section title={t("investigations")}>
                    {entry.investigations.map((inv) => (
                      <p key={inv} className="text-xs text-gray-700">
                        {inv}
                      </p>
                    ))}
                  </Section>
                ) : null}
              </article>
            </div>
          </li>
        ))}
      </ol>

      <div className="my-6 flex justify-center">
        <button
          type="button"
          onClick={() => {
            /* TODO: paginate when backend endpoint lands */
          }}
          className="inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-6 text-xs font-semibold text-white hover:bg-brand-primary/90"
        >
          {t("loadMore")}
        </button>
      </div>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-brand-primary">{title}</h4>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}
