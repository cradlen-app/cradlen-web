import {
  ArrowRight,
  BookOpen,
  Building2,
  GitBranch,
  LineChart,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import SectionLabel from "./SectionLabel";

const STEP_ICONS = [Building2, Users, GitBranch, LineChart];

export default async function HowItWorks() {
  const t = await getTranslations("home.howItWorks");
  const steps = t.raw("steps") as Array<{ title: string; description: string }>;

  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
        <div>
          <SectionLabel no={t("sectionNo")}>{t("eyebrow")}</SectionLabel>
          <h2 className="mt-7 max-w-md text-3xl font-semibold leading-[1.1] tracking-tight text-brand-black sm:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-brand-black/60 lg:ms-auto lg:text-end">
          {t("subheading")}
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Building2;
          return (
            <div
              key={step.title}
              className="rounded-[22px] bg-white p-6 shadow-sm shadow-black/[0.03] ring-1 ring-black/[0.04]"
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold text-brand-primary">
                  0{index + 1}
                </span>
                <span className="grid size-9 place-items-center rounded-xl bg-brand-secondary/20 text-brand-primary">
                  <Icon className="size-5" />
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-brand-black">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-brand-black/60">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Documentation band */}
      <div
        id="docs"
        className="relative mt-6 scroll-mt-24 overflow-hidden rounded-[26px] bg-brand-black p-8 sm:p-10"
      >
        <div className="pointer-events-none absolute -bottom-16 -end-10 size-64 rounded-full bg-brand-primary/30 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-secondary">
              <BookOpen className="size-4" />
              {t("docs.eyebrow")}
            </div>
            <h3 className="mt-4 max-w-md text-2xl font-semibold text-white sm:text-3xl">
              {t("docs.heading")}
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
              {t("docs.description")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button
              asChild
              className="h-11 rounded-full bg-brand-secondary px-6 text-sm text-brand-black hover:bg-brand-secondary/90"
            >
              <a href="#docs">
                {t("docs.readDocs")}
                <ArrowRight className="ms-1 size-4 rtl:rotate-180" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-white/25 bg-transparent px-6 text-sm text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#features">{t("docs.watchDemo")}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
