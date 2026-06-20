import { ArrowRight, Building2, Languages, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import HeroMedia from "./HeroMedia";

export default async function Hero() {
  const t = await getTranslations("home.hero");
  const tStrip = await getTranslations("home.strip");

  const strip = [
    { icon: Building2, text: tStrip("item1") },
    { icon: Languages, text: tStrip("item2") },
    { icon: ShieldCheck, text: tStrip("item3") },
  ];

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-5 pb-12 pt-12 sm:px-8 lg:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary">
            <span className="size-2 rounded-full bg-brand-primary" />
            {t("eyebrow")}
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-brand-black sm:text-5xl lg:text-6xl">
            {t("titlePre")}{" "}
            <span className="relative inline-block text-brand-primary">
              {t("titleHighlight")}
              <svg
                aria-hidden
                viewBox="0 0 200 18"
                preserveAspectRatio="none"
                className="absolute inset-x-0 -bottom-1 h-3 w-full text-brand-secondary"
              >
                <path
                  d="M3 12 C 50 4, 150 4, 197 11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {t("titlePost")}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-brand-black/70 sm:text-lg">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-12 rounded-full bg-brand-primary px-8 text-sm text-white hover:bg-brand-primary/90"
            >
              <Link href="/sign-up">
                {t("ctaPrimary")}
                <ArrowRight className="ms-1 size-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-12 rounded-full px-5 text-sm text-brand-black hover:bg-black/5"
            >
              <a href="#how-it-works">
                {t("ctaSecondary")}
                <ArrowRight className="ms-1 size-4 rtl:rotate-180" />
              </a>
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-black/60">
            <span className="inline-flex items-center gap-2">
              <span className="text-brand-primary">✓</span>
              {t("trust1")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-brand-primary">✓</span>
              {t("trust2")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-brand-primary">✓</span>
              {t("trust3")}
            </span>
          </div>
        </div>

        <HeroMedia />
      </div>
      </section>

      <div className="border-y border-black/5 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-6 sm:grid-cols-3 sm:px-8">
          {strip.map((item) => (
            <div
              key={item.text}
              className="flex items-center justify-center gap-2.5 text-sm text-brand-black/70 sm:justify-start"
            >
              <item.icon className="size-4 shrink-0 text-brand-primary" />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
