"use client";

import { useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/common/MultiSelect";
import type { OrganizationBranch } from "@/features/settings/lib/settings.api";
import { useServices } from "../../hooks/useServices";
import { useAuthorizeServices } from "../../hooks/useAuthorizations";

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  branches: OrganizationBranch[];
};

export function AuthorizeServiceDrawer({
  open,
  onOpenChange,
  profileId,
  branches,
}: Props) {
  const t = useTranslations("financial.authorizations");
  const tCommon = useTranslations("financial.common");
  const { services } = useServices({ active: true });
  const authorize = useAuthorizeServices(profileId);

  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [branchId, setBranchId] = useState("");
  const [duration, setDuration] = useState("");

  const serviceOptions = useMemo(
    () => services.map((s) => ({ value: s.id, label: s.name })),
    [services],
  );

  function reset() {
    setServiceIds([]);
    setBranchId("");
    setDuration("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (serviceIds.length === 0) return;
    const durationNum = Number(duration);
    authorize.mutate(
      {
        service_ids: serviceIds,
        branch_id: branchId || undefined,
        duration_minutes:
          duration.trim() !== "" && durationNum > 0 ? durationNum : undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(t("authorizedCount", { count: res.data.length }));
          handleClose();
        },
      },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-51 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {t("authorizeTitle")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {t("authorizeDescription")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-900"
              onClick={handleClose}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Services */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.service")} <span className="text-red-500">*</span>
                </label>
                <MultiSelect
                  options={serviceOptions}
                  value={serviceIds}
                  onChange={setServiceIds}
                  placeholder={t("selectServices")}
                />
              </div>

              {/* Branch — optional (empty = all branches) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.branch")}{" "}
                  <span className="text-gray-400">{tCommon("optional")}</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t("allBranches")}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration — optional */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.duration")}{" "}
                  <span className="text-gray-400">{tCommon("optional")}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={t("durationPlaceholder")}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={authorize.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={serviceIds.length === 0 || authorize.isPending}
              >
                {authorize.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {tCommon("saving")}
                  </>
                ) : (
                  t("authorizeService")
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
