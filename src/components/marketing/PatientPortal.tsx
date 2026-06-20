import {
  Bell,
  CalendarDays,
  FlaskConical,
  Home,
  IdCard,
  Pill,
  User,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/common/utils/utils";
import SectionLabel from "./SectionLabel";

const FEATURE_ICONS = [IdCard, Pill, FlaskConical];

export default async function PatientPortal() {
  const t = await getTranslations("home.patientPortal");
  const features = t.raw("features") as Array<{
    title: string;
    description: string;
  }>;

  const tabs = [
    { icon: Home, label: t("phone.tabHome"), active: true },
    { icon: CalendarDays, label: t("phone.tabVisits"), active: false },
    { icon: Pill, label: t("phone.tabMeds"), active: false },
    { icon: FlaskConical, label: t("phone.tabTests"), active: false },
    { icon: User, label: t("phone.tabProfile"), active: false },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid items-center gap-14 lg:grid-cols-[auto_1fr] lg:gap-20">
        {/* Phone mockup */}
        <div className="mx-auto w-full max-w-[19rem]">
          <div className="rounded-[2.6rem] bg-brand-black p-2.5 shadow-2xl shadow-black/20">
            <div className="overflow-hidden rounded-[2.1rem] bg-white">
              {/* Header */}
              <div className="bg-brand-primary px-4 pb-5 pt-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-full bg-white/15 text-xs font-semibold">
                      SA
                    </span>
                    <span>
                      <span className="block text-[11px] text-white/70">
                        {t("phone.welcomeBack")}
                      </span>
                      <span className="block text-sm font-semibold">
                        {t("phone.patientName")}
                      </span>
                    </span>
                  </div>
                  <Bell className="size-5 text-white/80" />
                </div>

                <div className="mt-4 rounded-2xl bg-white/10 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {t("phone.careTitle")}
                    </span>
                    <span className="rounded-full bg-brand-secondary/30 px-2 py-0.5 text-[10px] font-medium text-white">
                      {t("phone.episode")}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i < 2 ? "bg-brand-secondary" : "bg-white/25",
                        )}
                      />
                    ))}
                  </div>
                  <span className="mt-3 block text-[11px] text-white/75">
                    {t("phone.next")}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-3 p-4">
                <div className="rounded-2xl bg-[#F7F7F1] p-3.5">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Pill className="size-4" />
                    <span className="text-xs font-semibold text-brand-black/70">
                      {t("phone.rxLabel")}
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1 size-1.5 rounded-full bg-brand-primary" />
                      <span>
                        <span className="block text-sm font-medium text-brand-black">
                          {t("phone.rx1")}
                        </span>
                        <span className="block text-[11px] text-brand-black/50">
                          {t("phone.rx1Note")}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 border-t border-black/5 pt-3">
                      <span className="mt-1 size-1.5 rounded-full bg-brand-secondary" />
                      <span>
                        <span className="block text-sm font-medium text-brand-black">
                          {t("phone.rx2")}
                        </span>
                        <span className="block text-[11px] text-brand-black/50">
                          {t("phone.rx2Note")}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F7F7F1] p-3.5">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <FlaskConical className="size-4" />
                    <span className="text-xs font-semibold text-brand-black/70">
                      {t("phone.labsLabel")}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-brand-black">
                        {t("phone.lab1")}
                      </span>
                      <span className="block text-[11px] text-brand-black/50">
                        {t("phone.lab1Note")}
                      </span>
                    </span>
                    <span className="rounded-full bg-brand-secondary/25 px-3 py-1 text-[11px] font-medium text-brand-primary">
                      {t("phone.view")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex items-center justify-between border-t border-black/5 px-3 py-2.5">
                {tabs.map((tab) => (
                  <span
                    key={tab.label}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1 text-[9px]",
                      tab.active ? "text-brand-primary" : "text-brand-black/40",
                    )}
                  >
                    <tab.icon className="size-4" />
                    {tab.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div>
          <SectionLabel no={t("sectionNo")}>{t("eyebrow")}</SectionLabel>
          <h2 className="mt-7 max-w-md text-3xl font-semibold leading-[1.1] tracking-tight text-brand-black sm:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-brand-black/65 sm:text-lg">
            {t("description")}
          </p>

          <div className="mt-9 space-y-6">
            {features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index] ?? IdCard;
              return (
                <div key={feature.title} className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-secondary/20 text-brand-primary">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-brand-black">
                      {feature.title}
                    </span>
                    <span className="mt-1 block max-w-md text-sm leading-6 text-brand-black/60">
                      {feature.description}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
