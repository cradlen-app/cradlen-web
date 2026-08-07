import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  /** Shows the register action. Gated by `canRegisterPatient` in the page. */
  canRegister?: boolean;
  onRegister?: () => void;
};

export function PatientsHeader({ canRegister, onRegister }: Props) {
  const t = useTranslations("patients");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-medium text-brand-black">{t("title")}</h1>
      {canRegister && (
        <Button type="button" size="sm" onClick={onRegister}>
          <UserPlus className="size-4" aria-hidden="true" />
          {t("addPatient")}
        </Button>
      )}
    </div>
  );
}
