import {
  Activity,
  CalendarCheck,
  CalendarDays,
  Check,
  FilePlus,
  FlaskConical,
  GitBranch,
  Pill,
  Stethoscope,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/common/utils/utils";
import SectionLabel from "./SectionLabel";

function IconBadge({ icon: Icon }: { icon: typeof GitBranch }) {
  return (
    <span className="grid size-11 place-items-center rounded-2xl bg-brand-secondary/20 text-brand-primary">
      <Icon className="size-5" />
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-medium text-brand-primary">
      {children}
    </span>
  );
}

const cardBase =
  "rounded-[26px] bg-white p-7 shadow-sm shadow-black/[0.03] ring-1 ring-black/[0.04] sm:p-8";

export default async function WhatsInside() {
  const t = await getTranslations("home.whatsInside");

  const steps = [
    { label: t("journeys.step1"), state: "done" },
    { label: t("journeys.step2"), state: "done" },
    { label: t("journeys.step3"), state: "active" },
    { label: t("journeys.step4"), state: "todo" },
    { label: t("journeys.step5"), state: "todo" },
  ] as const;

  const records = [
    { icon: Activity, label: t("medicalHistory.row1Label"), branch: t("medicalHistory.row1Branch") },
    { icon: Pill, label: t("medicalHistory.row2Label"), branch: t("medicalHistory.row2Branch") },
    { icon: FlaskConical, label: t("medicalHistory.row3Label"), branch: t("medicalHistory.row3Branch") },
  ];

  return (
    <section id="features" className="scroll-mt-24 bg-[#F4F3EC]">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionLabel no={t("sectionNo")}>{t("eyebrow")}</SectionLabel>
        <h2 className="mt-7 max-w-2xl text-3xl font-semibold leading-[1.12] tracking-tight text-brand-black sm:text-4xl lg:text-5xl">
          {t("heading")}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-5">
          {/* Patient journeys & care paths */}
          <div className={cn(cardBase, "grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center")}>
            <div>
              <IconBadge icon={GitBranch} />
              <h3 className="mt-5 text-xl font-semibold text-brand-black sm:text-2xl">
                {t("journeys.title")}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-brand-black/60 sm:text-base">
                {t("journeys.description")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Tag>{t("journeys.tag1")}</Tag>
                <Tag>{t("journeys.tag2")}</Tag>
                <Tag>{t("journeys.tag3")}</Tag>
              </div>
            </div>

            {/* Journey stepper mock */}
            <div className="rounded-2xl bg-[#F7F7F1] p-5 ring-1 ring-black/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-brand-black/70">
                  {t("journeys.mockTitle")}
                </span>
                <span className="shrink-0 rounded-full bg-brand-secondary/25 px-2.5 py-1 text-[11px] font-medium text-brand-primary">
                  {t("journeys.mockEpisode")}
                </span>
              </div>

              <div className="mt-6 flex items-start justify-between">
                {steps.map((step, index) => (
                  <div
                    key={step.label}
                    className="relative flex flex-1 flex-col items-center"
                  >
                    {index > 0 ? (
                      <span
                        className={cn(
                          "absolute end-1/2 top-3 h-0.5 w-full -translate-y-1/2",
                          step.state === "todo"
                            ? "bg-black/10"
                            : "bg-brand-secondary/50",
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 grid size-6 place-items-center rounded-full",
                        step.state === "done" && "bg-brand-primary text-white",
                        step.state === "active" &&
                          "border-[5px] border-brand-primary bg-white",
                        step.state === "todo" && "border-2 border-black/15 bg-white",
                      )}
                    >
                      {step.state === "done" ? <Check className="size-3" /> : null}
                    </span>
                    <span className="mt-2 text-[10px] font-medium text-brand-black/60">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/[0.04]">
                <span className="size-1.5 rounded-full bg-brand-primary" />
                <span className="text-xs text-brand-black/60">
                  {t("journeys.mockNote")}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar + Prescriptions */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className={cardBase}>
              <IconBadge icon={CalendarDays} />
              <h3 className="mt-5 text-lg font-semibold text-brand-black sm:text-xl">
                {t("calendar.title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-brand-black/60">
                {t("calendar.description")}
              </p>
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-[#F7F7F1] px-3 py-2.5">
                  <span className="text-xs font-semibold text-brand-black/70">
                    {t("calendar.row1Time")}
                  </span>
                  <span className="flex-1 text-sm text-brand-black/70">
                    {t("calendar.row1Text")}
                  </span>
                  <span className="size-2 rounded-full bg-brand-secondary" />
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-brand-secondary/15 px-3 py-2.5 ring-1 ring-brand-primary/15">
                  <span className="text-xs font-semibold text-brand-primary">
                    {t("calendar.row2Time")}
                  </span>
                  <span className="flex-1 text-sm font-medium text-brand-primary">
                    {t("calendar.row2Text")}
                  </span>
                  <span className="size-2 rounded-full bg-brand-primary" />
                </div>
              </div>
            </div>

            <div className={cardBase}>
              <IconBadge icon={Pill} />
              <h3 className="mt-5 text-lg font-semibold text-brand-black sm:text-xl">
                {t("prescriptions.title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-brand-black/60">
                {t("prescriptions.description")}
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#F7F7F1] px-3 py-3">
                <span className="grid size-9 place-items-center rounded-lg bg-white text-[11px] font-bold text-brand-primary ring-1 ring-black/5">
                  {t("prescriptions.mockTag")}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-brand-black">
                    {t("prescriptions.mockName")}
                  </span>
                  <span className="block text-xs text-brand-black/50">
                    {t("prescriptions.mockDose")}
                  </span>
                </span>
                <Check className="size-4 text-brand-primary" />
              </div>
            </div>
          </div>

          {/* Unified medical history */}
          <div className={cn(cardBase, "grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center")}>
            <div>
              <IconBadge icon={FilePlus} />
              <h3 className="mt-5 text-xl font-semibold text-brand-black sm:text-2xl">
                {t("medicalHistory.title")}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-brand-black/60 sm:text-base">
                {t("medicalHistory.description")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Tag>{t("medicalHistory.tag1")}</Tag>
                <Tag>{t("medicalHistory.tag2")}</Tag>
                <Tag>{t("medicalHistory.tag3")}</Tag>
              </div>
            </div>

            {/* Unified patient record mock */}
            <div className="rounded-2xl bg-[#F7F7F1] p-5 ring-1 ring-black/[0.04]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-secondary/40 text-sm font-semibold text-brand-primary">
                  SA
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-brand-black">
                    {t("medicalHistory.patientName")}
                  </span>
                  <span className="block truncate text-xs text-brand-black/50">
                    {t("medicalHistory.patientMeta")}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-brand-secondary/25 px-2.5 py-1 text-[11px] font-medium text-brand-primary">
                  {t("medicalHistory.allBranches")}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {records.map((record) => (
                  <div
                    key={record.label}
                    className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/[0.04]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-secondary/20 text-brand-primary">
                      <record.icon className="size-4" />
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-brand-black/75">
                      {record.label}
                    </span>
                    <span className="shrink-0 text-xs text-brand-black/45">
                      {record.branch}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cash + Examinations */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className={cardBase}>
              <IconBadge icon={CalendarCheck} />
              <h3 className="mt-5 text-lg font-semibold text-brand-black sm:text-xl">
                {t("cash.title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-brand-black/60">
                {t("cash.description")}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-[#F7F7F1] px-4 py-3.5">
                <span>
                  <span className="block text-xs text-brand-black/50">
                    {t("cash.mockLabel")}
                  </span>
                  <span className="block text-lg font-semibold text-brand-primary">
                    {t("cash.mockAmount")}
                  </span>
                </span>
                <span className="rounded-full bg-brand-secondary/25 px-3 py-1 text-xs font-medium text-brand-primary">
                  {t("cash.mockStatus")}
                </span>
              </div>
            </div>

            <div className={cardBase}>
              <IconBadge icon={Stethoscope} />
              <h3 className="mt-5 text-lg font-semibold text-brand-black sm:text-xl">
                {t("exams.title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-brand-black/60">
                {t("exams.description")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Tag>{t("exams.tag1")}</Tag>
                <Tag>{t("exams.tag2")}</Tag>
                <Tag>{t("exams.tag3")}</Tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
