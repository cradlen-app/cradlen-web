"use client";

import { Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisitJourney } from "@/features/journeys/lib/useVisitJourney";
import { JourneyClinicalTab } from "@/features/journeys/components/JourneyClinicalTab";
import { useVisit } from "../../../hooks/useVisit";
import { ExaminationTab } from "../tabs/ExaminationTab";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string | null;
};

function formatDate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const formatLocale = locale.startsWith("en") ? "en-GB" : locale;
  return new Intl.DateTimeFormat(formatLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function VisitDetailsDialog(props: Props) {
  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && props.visitId ? (
        <DialogBody visitId={props.visitId} />
      ) : null}
    </Dialog.Root>
  );
}

function DialogBody({ visitId }: { visitId: string }) {
  const t = useTranslations("visits.workspace.history");
  const tExam = useTranslations("examination.workspace");
  const locale = useLocale();
  const visitQuery = useVisit(visitId);
  const visit = visitQuery.data ?? null;
  const journeyQuery = useVisitJourney(visitId);
  const descriptor = journeyQuery.data ?? null;
  const surface = descriptor?.clinical_surface ?? null;

  const dateLabel = formatDate(
    visit?.completedAt ?? visit?.scheduledAt ?? visit?.createdAt,
    locale,
  );
  const subtitle = visit
    ? [dateLabel, t(`typeLabel.${visit.type}`)].filter(Boolean).join(" · ")
    : null;

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none">
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <Dialog.Title className="text-base font-semibold text-brand-black">
              {t("detailsTitle")}
            </Dialog.Title>
            {subtitle ? (
              <Dialog.Description className="mt-0.5 text-xs text-gray-500">
                {subtitle}
              </Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">
                {t("detailsTitle")}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close
            aria-label={t("detailsTitle")}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
          {visitQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 py-12 text-xs text-gray-400">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {tExam("loading")}
            </div>
          ) : !visit ? (
            <div className="flex flex-1 items-center justify-center py-12 text-xs text-red-500">
              {tExam("loadError")}
            </div>
          ) : surface && descriptor ? (
            <Tabs
              defaultValue="examination"
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="shrink-0">
                <TabsTrigger value="examination">
                  {t("examinationTab")}
                </TabsTrigger>
                <TabsTrigger value="journey">{surface.label}</TabsTrigger>
              </TabsList>
              <TabsContent
                value="examination"
                className="mt-3 min-h-0 flex-1 overflow-y-auto"
              >
                <ExaminationTab visit={visit} readOnly />
              </TabsContent>
              <TabsContent
                value="journey"
                className="mt-3 min-h-0 flex-1 overflow-y-auto"
              >
                <JourneyClinicalTab
                  visitId={visit.id}
                  descriptor={descriptor}
                  readOnly
                />
              </TabsContent>
            </Tabs>
          ) : (
            <ExaminationTab visit={visit} readOnly />
          )}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
