"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScreenHeader } from "./portal-ui";
import { VisitsHistory } from "./VisitsHistory";
import { PatientHistory } from "./PatientHistory";

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
          <PatientHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
