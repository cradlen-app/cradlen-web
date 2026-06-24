import { CalendarDays, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import WorkspaceMockup from "./WorkspaceMockup";

/**
 * Hero visual: a faithful, static reproduction of the visit-workspace "Overview"
 * screen, presented inside an app-window frame and scaled down with CSS `zoom`
 * (which reflows the layout box so the frame shrink-wraps the scaled content),
 * with two floating "journey" cards layered on top for depth. Pure presentation;
 * the mockup uses fictional data only. Mirrors correctly in RTL.
 */
export default async function HeroMedia() {
  const t = await getTranslations("home.hero");

  return (
    <div className="relative mx-auto w-fit max-w-full lg:mx-0 lg:ms-auto">
      {/* App-window frame (tall portrait) */}
      <div
        role="img"
        aria-label={t("mediaAlt")}
        className="max-w-full overflow-hidden rounded-[18px] bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-black/5 bg-gray-50 px-4 py-2.5">
          <span
            className="size-2.5 rounded-full bg-gray-300"
            aria-hidden="true"
          />
          <span
            className="size-2.5 rounded-full bg-gray-300"
            aria-hidden="true"
          />
          <span
            className="size-2.5 rounded-full bg-gray-300"
            aria-hidden="true"
          />
          <span className="ms-3 rounded-md bg-white px-3 py-1 text-[11px] text-gray-400 ring-1 ring-black/5">
            app.cradlen.com
          </span>
        </div>

        {/* Scaled desktop canvas — top-aligned, cropped to a tall portrait */}
        <div className="relative h-[330px] overflow-hidden sm:h-[410px] lg:h-[510px]">
          <div className="origin-top [zoom:0.4] sm:[zoom:0.46] lg:[zoom:0.56]">
            <WorkspaceMockup />
          </div>
          {/* Bottom fade */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent"
            aria-hidden="true"
          />
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
      <div className="absolute -bottom-5 end-2 w-64 rounded-2xl bg-white p-4 shadow-xl shadow-black/10 ring-1 ring-black/5 z-10">
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
