"use client";

import { Dialog } from "radix-ui";
import { ChevronRight, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { formatRepDate } from "../lib/medical-rep.utils";
import { fetchMedicalRepVisits } from "../lib/medical-rep.api";
import type { MedicalRep } from "../types/medical-rep.types";

interface Props {
  rep: MedicalRep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MedicalRepDrawer({ rep, open, onOpenChange }: Props) {
  const t = useTranslations("medicalRep.drawer");
  const locale = useLocale();
  const router = useRouter();
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);

  const visitsQuery = useQuery({
    queryKey: ["medical-rep-visits", "by-rep", rep?.id],
    queryFn: () => fetchMedicalRepVisits(rep!.id),
    enabled: open && !!rep,
    staleTime: 10_000,
  });

  function openVisit(visitId: string) {
    if (!organizationId || !branchId) return;
    onOpenChange(false);
    router.push(
      `/${organizationId}/${branchId}/dashboard/medical-rep/${visitId}`,
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 transition-opacity" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-[41] flex w-full max-w-[480px] flex-col bg-white shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-xs text-gray-400">{t("breadcrumb")}</p>
              <Dialog.Title className="mt-0.5 text-base font-bold text-brand-black">
                {rep?.full_name ?? t("title")}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {t("title")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="mt-0.5 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {rep && (
              <>
                <ReadField label={t("phone")} value={rep.phone ?? "—"} />
                <ReadField label={t("nationalId")} value={rep.national_id ?? "—"} />
                <ReadField label={t("company")} value={rep.company_name ?? "—"} />
                <ReadField
                  label={t("specialtyFocus")}
                  value={rep.specialty_focus ?? "—"}
                />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label={t("lastVisit")} value={formatRepDate(rep.last_visit_date, locale)} />
                  <ReadField label={t("totalVisits")} value={String(rep.visits_count)} />
                </div>

                {/* Products */}
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-700">{t("products")}</p>
                  {rep.products.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rep.products.map((p) => (
                        <span
                          key={p}
                          className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-700">{t("notes")}</p>
                  <p className="text-sm text-gray-600">{rep.notes ?? "—"}</p>
                </div>

                {/* Visits — click to open the visit workspace */}
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-700">
                    {t("visits")}
                  </p>
                  {visitsQuery.isLoading ? (
                    <p className="text-sm text-gray-400">{t("visitsLoading")}</p>
                  ) : (visitsQuery.data?.data.length ?? 0) > 0 ? (
                    <ul className="space-y-1.5">
                      {visitsQuery.data!.data.map((v) => (
                        <li key={v.id}>
                          <button
                            type="button"
                            onClick={() => openVisit(v.id)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-start text-sm transition-colors hover:border-brand-primary/40 hover:bg-gray-50"
                          >
                            <span className="text-brand-black">
                              {formatRepDate(v.scheduled_at, locale)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              {t(`visitStatus.${v.status}`)}
                              <ChevronRight
                                className="size-3.5 rtl:rotate-180"
                                aria-hidden
                              />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">{t("noVisits")}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-sm text-gray-600">{value}</p>
    </div>
  );
}
