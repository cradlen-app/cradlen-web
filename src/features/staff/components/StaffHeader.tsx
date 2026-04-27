import { Mail, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type StaffHeaderProps = {
  onCreateStaff?: () => void;
};

export function StaffHeader({ onCreateStaff }: StaffHeaderProps) {
  const t = useTranslations("staff");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-medium text-brand-black">{t("title")}</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/staff/invitations"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-500 transition-colors hover:border-brand-primary/30 hover:text-brand-primary"
        >
          <Mail className="size-4" aria-hidden="true" />
          {t("invitations.link")}
        </Link>
        <Button
          type="button"
          onClick={onCreateStaff}
          className="rounded-full bg-brand-primary px-5 text-white hover:bg-brand-primary/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("newStaff")}
        </Button>
      </div>
    </div>
  );
}
