import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import TrackedLink from "@/components/analytics/TrackedLink";

export default async function FinalCta() {
  const t = await getTranslations("home.finalCta");

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <div className="relative overflow-hidden rounded-[30px] bg-brand-primary px-6 py-16 text-center sm:px-10 lg:py-24">
        <div className="pointer-events-none absolute -top-16 start-1/4 size-72 rounded-full bg-brand-secondary/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-white/75">
            {t("description")}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-full bg-white px-8 text-sm font-medium text-brand-primary hover:bg-white/90"
            >
              <TrackedLink
                href="/sign-up"
                event="cta_start_free"
                eventProps={{ location: "final_cta" }}
              >
                {t("cta")}
                <ArrowRight className="ms-1 size-4 rtl:rotate-180" />
              </TrackedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-white/30 bg-transparent px-8 text-sm text-white hover:bg-white/10 hover:text-white"
            >
              <TrackedLink
                href="/contact"
                event="cta_contact"
                eventProps={{ location: "final_cta" }}
              >
                {t("ctaSecondary")}
              </TrackedLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
