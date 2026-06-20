import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";

type Tier = {
  name: string;
  price: string;
  period: string;
  note: string;
  cta: string;
  features: string[];
};

const FEATURED_INDEX = 2;

export default async function Pricing() {
  const t = await getTranslations("home.pricing");
  const tiers = t.raw("tiers") as Tier[];

  return (
    <section id="pricing" className="scroll-mt-24 bg-[#ECEBE1]">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-brand-black sm:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="mt-5 text-sm text-brand-black/60 sm:text-base">
            {t("subheadingPre")}
            <span className="font-semibold text-brand-black">
              {t("subheadingBold")}
            </span>
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-4 lg:items-start">
          {tiers.map((tier, index) => {
            const featured = index === FEATURED_INDEX;
            return (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-[24px] p-7",
                  featured
                    ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 lg:-translate-y-3"
                    : "bg-white ring-1 ring-black/[0.05]",
                )}
              >
                {featured ? (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-brand-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-black rtl:translate-x-1/2">
                    {t("popular")}
                  </span>
                ) : null}

                <h3
                  className={cn(
                    "text-base font-semibold",
                    featured ? "text-white" : "text-brand-black",
                  )}
                >
                  {tier.name}
                </h3>

                <div className="mt-4 flex items-end gap-1">
                  <span
                    className={cn(
                      "text-3xl font-semibold tracking-tight",
                      featured ? "text-white" : "text-brand-black",
                    )}
                  >
                    {tier.price}
                  </span>
                  {tier.period ? (
                    <span
                      className={cn(
                        "pb-1 text-sm",
                        featured ? "text-white/70" : "text-brand-black/50",
                      )}
                    >
                      {tier.period}
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    featured ? "text-white/70" : "text-brand-black/55",
                  )}
                >
                  {tier.note}
                </p>

                <div
                  className={cn(
                    "my-6 h-px w-full",
                    featured ? "bg-white/15" : "bg-black/8",
                  )}
                />

                <ul className="space-y-3.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          featured ? "text-brand-secondary" : "text-brand-primary",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          featured ? "text-white/90" : "text-brand-black/75",
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "mt-8 h-11 w-full rounded-full text-sm",
                    featured
                      ? "bg-white text-brand-primary hover:bg-white/90"
                      : index === tiers.length - 1
                        ? "bg-brand-black text-white hover:bg-brand-black/90"
                        : "bg-brand-secondary/25 text-brand-primary hover:bg-brand-secondary/40",
                  )}
                >
                  <Link href="/sign-up">{tier.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
