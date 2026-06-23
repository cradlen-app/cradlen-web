"use client";

import { useTranslations } from "next-intl";
import { FlaskConical } from "lucide-react";

export interface ExaminationInvestigation {
  id: string;
  custom_test_name?: string | null;
  lab_test?: { name: string } | null;
  test_category?: string | null;
  lab_facility?: string | null;
  status: string; // ORDERED | RESULTED | REVIEWED | CANCELLED
  result_text?: string | null;
  notes?: string | null;
  result_attachments?: { id: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  ORDERED: "bg-amber-50 text-amber-700 border border-amber-100",
  RESULTED: "bg-blue-50 text-blue-700 border border-blue-100",
  REVIEWED: "bg-green-50 text-green-700 border border-green-100",
  CANCELLED: "bg-gray-100 text-gray-500 line-through",
};

type Props = { investigations: ExaminationInvestigation[] };

/**
 * Read-only list of a visit's lab/imaging investigations with their result
 * lifecycle — status, result text, notes, and an attachment count. The
 * examination template's investigations section only captures the ORDER; the
 * result fields live on the row and aren't template-bound, so they're rendered
 * here. (File download links are out of scope — count only.)
 */
export function InvestigationsResultPanel({ investigations }: Props) {
  const t = useTranslations("examination.workspace");

  return (
    <section className="mt-2">
      <header className="flex items-center gap-2">
        <FlaskConical
          className="size-4 text-brand-primary"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-brand-black">
          {t("investigationsTitle")}
        </h2>
      </header>

      {investigations.length === 0 ? (
        <p className="mt-3 text-xs italic text-gray-400">{t("invNone")}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {investigations.map((inv) => {
            const name =
              inv.custom_test_name?.trim() ||
              inv.lab_test?.name ||
              t("invUnnamed");
            const fileCount = inv.result_attachments?.length ?? 0;
            return (
              <li
                key={inv.id}
                className="rounded-lg border border-gray-100 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-brand-black">
                    {name}
                  </span>
                  {inv.test_category ? (
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      {inv.test_category}
                    </span>
                  ) : null}
                  <span
                    className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t(`invStatus.${inv.status}`)}
                  </span>
                </div>

                <dl className="mt-2 space-y-1 text-xs">
                  <Row label={t("invResult")}>
                    {inv.result_text?.trim() || (
                      <span className="italic text-gray-400">
                        {t("invNoResult")}
                      </span>
                    )}
                  </Row>
                  {inv.notes?.trim() ? (
                    <Row label={t("invNotes")}>{inv.notes}</Row>
                  ) : null}
                  {inv.lab_facility?.trim() ? (
                    <Row label={t("invLab")}>{inv.lab_facility}</Row>
                  ) : null}
                  {fileCount > 0 ? (
                    <Row label={t("invFilesLabel")}>
                      {t("invFiles", { count: fileCount })}
                    </Row>
                  ) : null}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 font-medium text-gray-500">{label}:</dt>
      <dd className="whitespace-pre-wrap text-gray-700">{children}</dd>
    </div>
  );
}
