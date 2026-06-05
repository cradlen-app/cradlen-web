"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ScreenHeader } from "./portal-ui";
import { VisitsHistory } from "./VisitsHistory";

export function RecordScreen() {
  const t = useTranslations("patientPortal");

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <ScreenHeader title={t("record.title")} />

      <Tabs
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <TabsList aria-label={t("record.tabsAria")}>
          <TabsTrigger value="overview">
            {t("record.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="history">{t("record.tabs.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="min-h-0 flex-1">
          <VisitsHistory />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1">
          <section className="flex h-full items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <EmptyState message={t("record.historyComingSoon")} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
