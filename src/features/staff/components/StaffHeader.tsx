"use client";

import { ChevronDown, Mail, Plus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";

type StaffHeaderProps = {
  canManage?: boolean;
  onInviteStaff?: () => void;
  onCreateDirectStaff?: () => void;
};

export function StaffHeader({ canManage, onInviteStaff, onCreateDirectStaff }: StaffHeaderProps) {
  const t = useTranslations("staff");
  const dashboardPath = useDashboardPath();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-medium text-brand-black">{t("title")}</h1>
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={dashboardPath("/staff/invitations") as Parameters<typeof Link>[0]["href"]}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-500 transition-colors hover:border-brand-primary/30 hover:text-brand-primary"
          >
            <Mail className="size-4" aria-hidden="true" />
            {t("invitations.link")}
          </Link>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                type="button"
                className="rounded-full bg-brand-primary px-5 text-white hover:bg-brand-primary/90"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("newStaff")}
                <ChevronDown className="ms-1 size-3.5 opacity-70" aria-hidden="true" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg shadow-black/5"
              >
                <DropdownMenu.Item
                  onSelect={onInviteStaff}
                  className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-black outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                >
                  <Mail className="size-4 text-gray-400" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("create.tabs.invite")}</p>
                    <p className="text-xs text-gray-400">{t("create.tabs.inviteHint")}</p>
                  </div>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={onCreateDirectStaff}
                  className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-black outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                >
                  <UserPlus className="size-4 text-gray-400" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("create.tabs.direct")}</p>
                    <p className="text-xs text-gray-400">{t("create.tabs.directHint")}</p>
                  </div>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    </div>
  );
}
