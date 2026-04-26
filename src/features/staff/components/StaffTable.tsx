import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getRoleTranslationKey, getStaffFullName } from "../lib/staff.utils";
import type { StaffMember } from "../types/staff.types";
import { StaffAvatar } from "./StaffAvatar";
import { StaffStatusBadge } from "./StaffStatusBadge";

type StaffTableProps = {
  members: StaffMember[];
  selectedId: string | null;
  onSelect: (member: StaffMember) => void;
};

const columns = ["name", "role", "specialty", "phone", "status"] as const;

export function StaffTable({ members, selectedId, onSelect }: StaffTableProps) {
  const t = useTranslations("staff");

  if (members.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-2xl bg-white px-4 text-sm text-gray-400">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white px-4">
      <table className="w-full min-w-180 text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((column) => (
              <th
                key={column}
                className="pb-3 pt-4 pe-4 text-start text-xs font-medium text-gray-400 last:pe-0"
              >
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const fullName = getStaffFullName(member);

            return (
              <tr
                key={member.id}
                onClick={() => onSelect(member)}
                aria-selected={selectedId === member.id}
                className={cn(
                  "cursor-pointer border-b border-gray-50 transition-colors last:border-0",
                  selectedId === member.id
                    ? "bg-brand-primary/5"
                    : "hover:bg-gray-50",
                )}
              >
                <td className="py-3 pe-4">
                  <div className="flex items-center gap-2.5">
                    <StaffAvatar name={fullName} />
                    <div className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-brand-black">
                        {fullName}
                      </span>
                      <span className="truncate text-xs font-thin text-gray-400">
                        {member.handle}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 pe-4">
                  <div className="flex flex-col leading-tight">
                    <span className="text-brand-black">
                      {t(getRoleTranslationKey(member.role))}
                    </span>
                    <span className="text-xs font-thin italic text-gray-400">
                      {member.jobTitle}
                    </span>
                  </div>
                </td>
                <td className="py-3 pe-4 text-brand-black">
                  {member.specialty || "-"}
                </td>
                <td className="py-3 pe-4 text-brand-black">{member.phone}</td>
                <td className="py-3">
                  <StaffStatusBadge status={member.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
