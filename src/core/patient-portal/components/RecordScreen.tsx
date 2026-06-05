"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealthRecord } from "../hooks/usePortalData";
import { EmptyState, ScreenHeader } from "./portal-ui";
import { VisitsHistory } from "./VisitsHistory";

export function RecordScreen() {
  const t = useTranslations("patientPortal");
  const { data: record, isLoading } = useHealthRecord();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ScreenHeader title={t("record.title")} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList aria-label={t("record.tabsAria")}>
          <TabsTrigger value="overview">{t("record.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="history">{t("record.tabs.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <VisitsHistory visits={record?.visits ?? []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="history">
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <EmptyState message={t("record.historyComingSoon")} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
