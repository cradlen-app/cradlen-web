import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type StaffHeaderProps = {
  onCreateStaff?: () => void;
};

export function StaffHeader({ onCreateStaff }: StaffHeaderProps) {
  const t = useTranslations("staff");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-medium text-brand-black">{t("title")}</h1>
      <Button
        type="button"
        onClick={onCreateStaff}
        className="rounded-full bg-brand-primary px-5 text-white hover:bg-brand-primary/90"
      >
        <Plus className="size-4" aria-hidden="true" />
        {t("newStaff")}
      </Button>
    </div>
  );
}
