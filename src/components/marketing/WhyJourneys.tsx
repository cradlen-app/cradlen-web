import { Check, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import SectionLabel from "./SectionLabel";

export default async function WhyJourneys() {
  const t = await getTranslations("home.whyJourneys");
  const oldWay = t.raw("oldWay") as string[];
  const newWay = t.raw("newWay") as string[];

  return (
    <section
      id="why-journeys"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"
    >
      <SectionLabel no={t("sectionNo")}>{t("eyebrow")}</SectionLabel>

      <h2 className="mt-7 max-w-4xl text-3xl font-semibold leading-[1.15] tracking-tight text-brand-black sm:text-4xl lg:text-5xl">
        {t("headingPre")}
        <span className="text-[#B5503F]">{t("headingHighlight")}</span>
        {t("headingPost")}
      </h2>

      <p className="mt-6 max-w-2xl text-base leading-7 text-brand-black/65 sm:text-lg">
        {t.rich("lead", {
          b: (chunks) => (
            <strong className="font-semibold text-brand-black">{chunks}</strong>
          ),
          j: (chunks) => (
            <strong className="font-semibold text-brand-primary">
              {chunks}
            </strong>
          ),
        })}
      </p>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {/* The visit-based way */}
        <div className="rounded-[26px] bg-[#ECEAE0] p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-black/45">
            {t("oldWayLabel")}
          </p>
          <ul className="mt-6 space-y-4">
            {oldWay.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <X className="size-5 shrink-0 rounded-full bg-black/5 p-0.5 text-brand-black/40" />
                <span className="text-sm text-brand-black/70 sm:text-base">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* The Cradlen journey */}
        <div className="relative overflow-hidden rounded-[26px] bg-brand-primary p-7 sm:p-9">
          <div className="pointer-events-none absolute -end-10 -top-10 size-44 rounded-full bg-brand-secondary/20 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-secondary">
            {t("newWayLabel")}
          </p>
          <ul className="mt-6 space-y-4">
            {newWay.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check className="size-5 shrink-0 text-brand-secondary" />
                <span className="text-sm font-medium text-white sm:text-base">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
