import Image from "next/image";
import { getTranslations } from "next-intl/server";

import heroMockup from "@/public/hero-visit-workspace.png";

/**
 * Hero visual: the real visit-workspace product screenshot, framed with soft
 * rounded corners and a subtle shadow. Pure presentation; mirrors correctly in RTL
 * via the wrapper's logical `lg:ms-auto`.
 */
export default async function HeroMedia() {
  const t = await getTranslations("home.hero");

  return (
    <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:ms-auto">
      <div className="overflow-hidden rounded-[28px] shadow-xl shadow-black/10 ring-1 ring-black/5">
        <Image
          src={heroMockup}
          alt={t("mediaAlt")}
          priority
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
