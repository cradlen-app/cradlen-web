import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type { Patient } from "@/features/visits/types/visits.types";
import { JourneyStatusBadge } from "./JourneyStatusBadge";

type PatientsTableProps = {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (patient: Patient) => void;
};

const COLUMNS = [
  { key: "name", className: "" },
  { key: "phone", className: "" },
  { key: "address", className: "" },
  { key: "lastVisit", className: "hidden sm:table-cell" },
  { key: "journey", className: "hidden sm:table-cell" },
  { key: "journeyStatus", className: "hidden sm:table-cell" },
] as const;

function PatientAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-medium text-brand-primary">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function PatientsTable({
  patients,
  selectedId,
  onSelect,
}: PatientsTableProps) {
  const t = useTranslations("patients");

  if (patients.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center text-sm text-gray-400">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white px-4">
      <table className="w-full min-w-105 text-sm sm:min-w-215">
        <thead>
          <tr className="border-b border-gray-100">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "pb-3 pt-4 pe-4 text-start text-xs font-medium text-gray-400 last:pe-0",
                  col.className,
                )}
              >
                {t(`columns.${col.key}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              onClick={() => onSelect(patient)}
              aria-selected={selectedId === patient.id}
              className={cn(
                "cursor-pointer border-b border-gray-50 transition-colors last:border-0",
                selectedId === patient.id
                  ? "bg-brand-primary/5"
                  : "hover:bg-gray-50",
              )}
            >
              <td className="py-3 pe-4">
                <div className="flex items-center gap-2.5">
                  <PatientAvatar name={patient.fullName} />
                  <span className="truncate font-medium text-brand-black">
                    {patient.fullName}
                  </span>
                </div>
              </td>
              <td className="py-3 pe-4 text-brand-black">
                {patient.phoneNumber ?? "—"}
              </td>
              <td className="max-w-40 py-3 pe-4">
                <span
                  className="block truncate text-brand-black"
                  title={patient.address}
                >
                  {patient.address ?? "—"}
                </span>
              </td>
              <td className="hidden py-3 pe-4 text-brand-black sm:table-cell">
                {patient.lastVisitDate ?? "—"}
              </td>
              <td className="hidden py-3 pe-4 text-brand-black sm:table-cell">
                {patient.journeyType
                  ? t(`journeyType.${patient.journeyType}`)
                  : "—"}
              </td>
              <td className="hidden py-3 sm:table-cell">
                {patient.journeyStatus ? (
                  <JourneyStatusBadge status={patient.journeyStatus} />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
