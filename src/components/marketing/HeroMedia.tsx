import { CalendarDays, Check, ImageIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Hero visual: a soft photo panel (placeholder dropzone — swap the inner block
 * for a real <Image> from src/public/ later) with two floating journey cards
 * layered on top. Pure presentation, mirrors correctly in RTL.
 */
export default async function HeroMedia() {
  const t = await getTranslations("home.hero");

  return (
    <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:ms-auto">
      {/* Photo panel placeholder */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-dashed border-brand-primary/25 bg-gradient-to-br from-brand-secondary/25 via-[#EDEDE3] to-brand-secondary/15">
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-2 text-brand-black/40">
            <ImageIcon className="size-7" />
          </div>
        </div>
      </div>

      {/* Floating: next on the journey */}
      <div className="absolute -top-4 start-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg shadow-black/5 ring-1 ring-black/5">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-secondary/20 text-brand-primary">
          <CalendarDays className="size-5" />
        </span>
        <span>
          <span className="block text-xs text-brand-black/50">
            {t("mediaNextLabel")}
          </span>
          <span className="block text-sm font-semibold text-brand-black">
            {t("mediaNextValue")}
          </span>
        </span>
      </div>

      {/* Floating: patient journey card */}
      <div className="absolute -bottom-5 end-2 w-64 rounded-2xl bg-white p-4 shadow-xl shadow-black/10 ring-1 ring-black/5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-secondary/40 text-xs font-semibold text-brand-primary">
            SA
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-brand-black">
              {t("patientName")}
            </span>
            <span className="block truncate text-xs text-brand-black/50">
              {t("patientMeta")}
            </span>
          </span>
          <span className="rounded-full bg-brand-secondary/25 px-2 py-0.5 text-[10px] font-medium text-brand-primary">
            {t("statusActive")}
          </span>
        </div>

        <ol className="mt-4 space-y-3">
          <li className="flex items-center gap-3">
            <span className="grid size-5 place-items-center rounded-full bg-brand-primary text-white">
              <Check className="size-3" />
            </span>
            <span>
              <span className="block text-xs font-medium text-brand-black">
                {t("tri1Title")}
              </span>
              <span className="block text-[10px] text-brand-black/45">
                {t("tri1Meta")}
              </span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="size-5 rounded-full border-[3px] border-brand-primary bg-white" />
            <span>
              <span className="block text-xs font-medium text-brand-black">
                {t("tri2Title")}
              </span>
              <span className="block text-[10px] text-brand-black/45">
                {t("tri2Meta")}
              </span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="size-5 rounded-full border-2 border-black/15 bg-white" />
            <span className="block text-xs font-medium text-brand-black/55">
              {t("tri3Title")}
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
