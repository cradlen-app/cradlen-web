import {
  Activity,
  BookOpen,
  ChevronDown,
  Clock,
  ImageIcon,
  Paperclip,
  Pencil,
} from "lucide-react";

/**
 * Static, server-rendered visual twin of the visit-workspace "Overview" tab — a
 * faithful, NON-interactive reproduction used only as the marketing hero mockup.
 * It copies the Tailwind classes of the real overview components for fidelity but
 * is decoupled from them (no hooks, sockets or DSL). All data is fictional mock
 * data — never real patient PII. Rendered at a fixed desktop width and scaled to
 * fit by HeroMedia.
 */
export default function WorkspaceMockup() {
  return (
    <div className="w-[1100px] bg-white text-brand-black">
      {/* Top bar: breadcrumb + Edit profile */}
      <div className="flex items-center justify-between gap-4 bg-gray-50 px-6 py-4">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Patients</span>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-brand-black">Sara Ahmed</span>
        </nav>
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-black">
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit profile
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-6 pt-4">
        <span className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white">
          Overview
        </span>
        <span className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400">
          History
        </span>
      </div>

      {/* Two-column overview grid */}
      <div className="grid grid-cols-[320px_minmax(0,1fr)] divide-x divide-gray-100 px-6 py-5">
        {/* Left sidebar */}
        <div className="flex flex-col gap-4 pe-3">
          {/* Patient summary card */}
          <section className="overflow-hidden rounded-xl">
            <div className="h-16 bg-brand-primary" aria-hidden="true" />
            <div className="-mt-8 flex flex-col items-center px-5 pb-4">
              <div
                className="flex size-16 items-center justify-center rounded-full bg-brand-primary text-base font-semibold text-white ring-4 ring-white"
                aria-hidden="true"
              >
                SA
              </div>
              <h2 className="mt-3 text-base font-semibold text-brand-black">
                Sara Ahmed
              </h2>
              <p className="text-xs text-gray-400">@sara_ahmed</p>
              <dl className="mt-3 w-full space-y-2 text-sm">
                <InfoRow label="Age" value="28 years" />
                <InfoRow label="Phone Number" value="0100 000 0000" />
                <InfoRow label="Address" value="15 Nile St, Cairo" />
                <InfoRow label="Marital Status" value="Married" />
              </dl>
            </div>
          </section>

          {/* Attachments & results */}
          <section>
            <header className="flex items-center gap-2">
              <Paperclip className="size-4 text-brand-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-black">
                Attachments &amp; results
              </h2>
            </header>
            <ul className="my-4 space-y-2">
              <li>
                <div className="flex w-full items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-start">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-black">
                      Complete blood count (CBC)
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      Laboratory Test • Jun 6, 2026
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        <ImageIcon className="size-3" aria-hidden="true" />
                        IMG
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Reviewed
                  </span>
                </div>
              </li>
            </ul>
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 divide-y divide-gray-100 ps-5">
          {/* OB/GYN history summary */}
          <section>
            <header className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-black">
                OB/GYN History Summary
              </h2>
            </header>
            <div className="my-4 space-y-3">
              <p className="text-sm font-semibold text-brand-primary">
                G2 T1 P0 A1 L1 • LMP 2026-05-31 • AB+
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Flag tone="amber">Hypothyroidism</Flag>
                <Flag tone="amber">Hemorrhage</Flag>
                <Flag tone="amber">Dysmenorrhea</Flag>
                <Flag tone="green">No known allergies</Flag>
              </div>
              <div className="space-y-1">
                <HistoryRow
                  label="Active gyn problems"
                  value="Genital warts, Infertility, Vulvar pain"
                />
                <HistoryRow
                  label="Past medical history"
                  value="Hypothyroidism, Hemorrhage, Blood transfusion, Hyperthyroidism"
                />
                <HistoryRow
                  label="Past surgical history"
                  value="Hysteroscopy, Laparoscopy"
                />
                <HistoryRow label="Medications" value="No regular medications" dim />
                <HistoryRow label="Allergies" value="No known allergies" dim />
                <HistoryRow
                  label="Family history"
                  value="No significant family history"
                  dim
                />
                <HistoryRow label="Social" value="No tobacco / alcohol / drugs" dim />
                <HistoryRow label="Screening" value="Screening not recorded" dim />
              </div>
            </div>
          </section>

          {/* Current journey */}
          <section className="pt-6">
            <header className="flex items-center gap-2">
              <Activity className="size-4 text-brand-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-black">
                Current Journey
              </h2>
            </header>
            <div className="my-4 space-y-3">
              <p className="text-sm font-semibold text-brand-primary">
                Surgical • Active • Pre-operative
              </p>
              <div className="space-y-1">
                <HistoryRow label="Chief complaint" value="Pelvic pain" />
                <HistoryRow label="Provisional" value="Ovarian cyst" />
              </div>
            </div>
          </section>

          {/* Visits history */}
          <section className="pt-6">
            <header className="flex items-center gap-2">
              <Clock className="size-4 text-brand-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-black">
                Visits History
              </h2>
            </header>

            <div className="my-6 space-y-1">
              {/* Surgical Journey (expanded) */}
              <div className="relative">
                <span
                  className="pointer-events-none absolute inset-y-0 start-[10px] w-px bg-gray-200"
                  aria-hidden="true"
                />
                <div className="relative flex w-full items-center gap-2 py-2.5">
                  <span className="relative z-10 flex size-[21px] flex-none items-center justify-center">
                    <span
                      className="size-3.5 rounded-full bg-brand-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <ChevronDown
                    className="size-4 flex-none text-brand-primary"
                    aria-hidden="true"
                  />
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-brand-black">
                        Surgical Journey
                      </span>
                      <span className="text-xs text-gray-400">
                        3 episodes · 1 visit
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="inline-flex flex-none items-center gap-1.5 text-[11px] text-gray-500">
                        <span
                          className="size-1.5 rounded-full bg-emerald-500"
                          aria-hidden="true"
                        />
                        Active
                      </span>
                      <span className="flex-none text-[11px] text-gray-500">
                        Started 23 Jun 2026 · Ongoing
                      </span>
                    </span>
                  </div>
                </div>

                {/* Episodes */}
                <div className="space-y-1 ps-7 pt-1">
                  <EpisodeRow
                    order="Episode 1"
                    name="Pre-operative"
                    visits="· 1 visit"
                    meta="Started 23 Jun 2026 · Ongoing"
                  />
                  <EpisodeRow order="Episode 2" name="Surgery" visits="· 0 visits" />
                  <EpisodeRow
                    order="Episode 3"
                    name="Post-operative"
                    visits="· 0 visits"
                  />
                </div>
              </div>

              {/* General GYN Journey (collapsed) */}
              <div className="relative">
                <div className="relative flex w-full items-center gap-2 py-2.5">
                  <span className="relative z-10 flex size-[21px] flex-none items-center justify-center">
                    <span
                      className="size-3.5 rounded-full bg-brand-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <ChevronDown
                    className="size-4 flex-none -rotate-90 text-gray-400"
                    aria-hidden="true"
                  />
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-brand-black">
                        General GYN Journey
                      </span>
                      <span className="text-xs text-gray-400">
                        1 episode · 6 visits
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="inline-flex flex-none items-center gap-1.5 text-[11px] text-gray-500">
                        <span
                          className="size-1.5 rounded-full bg-gray-400"
                          aria-hidden="true"
                        />
                        Completed
                      </span>
                      <span className="flex-none text-[11px] text-gray-500">
                        Started 19 May 2026 · Completed 23 Jun 2026
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-xs font-medium text-brand-black">{value}</dd>
    </div>
  );
}

function HistoryRow({
  label,
  value,
  dim,
}: {
  label: string;
  value: string;
  dim?: boolean;
}) {
  return (
    <div className="flex gap-1.5 text-xs">
      <span className="shrink-0 font-medium text-gray-500">{label}:</span>
      <span className={dim ? "italic text-gray-400" : "text-gray-700"}>{value}</span>
    </div>
  );
}

function Flag({
  tone,
  children,
}: {
  tone: "amber" | "green";
  children: React.ReactNode;
}) {
  const styles =
    tone === "amber"
      ? "bg-amber-50 text-amber-700 border border-amber-100"
      : "bg-green-50 text-green-700 border border-green-100";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

function EpisodeRow({
  order,
  name,
  visits,
  meta,
}: {
  order: string;
  name: string;
  visits: string;
  meta?: string;
}) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute inset-y-0 start-[10px] w-px bg-gray-200"
        aria-hidden="true"
      />
      <div className="relative flex w-full items-center gap-2 py-2">
        <span className="relative z-10 flex size-[21px] flex-none items-center justify-center">
          <span
            className="size-3 rounded-full border-2 border-brand-secondary bg-white"
            aria-hidden="true"
          />
        </span>
        <ChevronDown
          className="size-4 flex-none -rotate-90 text-gray-400"
          aria-hidden="true"
        />
        <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
              {order}
            </span>
            <span className="text-xs font-medium text-brand-black">{name}</span>
            <span className="text-xs text-gray-400">{visits}</span>
          </span>
          {meta ? (
            <span className="flex-none text-[11px] text-gray-500">{meta}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
