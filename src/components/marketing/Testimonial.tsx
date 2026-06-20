import { ImageIcon, Quote } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function Testimonial() {
  const t = await getTranslations("home.testimonial");

  return (
    <section className="bg-[#ECEAE0]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[auto_1fr] lg:gap-16 lg:py-28">
        {/* Photo placeholder */}
        <div className="relative mx-auto w-full max-w-[16rem]">
          <div className="grid aspect-[4/5] place-items-center rounded-[22px] border border-dashed border-brand-black/20 bg-[#E4E2D7]">
            <div className="flex flex-col items-center gap-2 text-center text-brand-black/40">
              <ImageIcon className="size-6" />
              <span className="text-xs">{t("dropPhoto")}</span>
              <span className="text-[11px] underline underline-offset-2">
                {t("browse")}
              </span>
            </div>
          </div>
          <span className="absolute -bottom-4 start-4 grid size-11 place-items-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-black/10">
            <Quote className="size-5 fill-current" />
          </span>
        </div>

        {/* Quote */}
        <figure>
          <blockquote className="text-2xl font-medium leading-[1.3] tracking-tight text-brand-black sm:text-3xl lg:text-[2.1rem]">
            {t("quote")}
          </blockquote>
          <figcaption className="mt-7 flex items-center gap-4">
            <span className="h-px w-8 bg-brand-primary" />
            <span>
              <span className="block text-sm font-semibold text-brand-black">
                {t("name")}
              </span>
              <span className="block text-sm text-brand-black/55">
                {t("role")}
              </span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
