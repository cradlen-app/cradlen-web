"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/common/utils/utils";
import { getStaffFullName } from "../lib/staff.utils";
import { useResetStaffPassword } from "../hooks/useManageStaff";
import type { StaffMember } from "../types/staff.types";
import DirectCreationSuccessModal from "./DirectCreationSuccessModal";

const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0";

type Props = {
  member: StaffMember | null;
  organizationId?: string;
  branchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StaffResetPasswordDialog({
  member,
  organizationId,
  branchId,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("staff.overview.resetPassword");
  const overviewT = useTranslations("staff.overview");
  const resetPassword = useResetStaffPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<
    { email: string; password: string } | null
  >(null);

  const schema = useMemo(
    () =>
      z.object({
        password: z
          .string()
          .min(8, t("validation.min"))
          .max(72, t("validation.max")),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });

  // Clear transient form state so the next open starts fresh — done on close
  // rather than in an effect (avoids the cascading-render lint rule).
  function clearForm() {
    reset({ password: "" });
    setShowPassword(false);
  }

  if (!member) return null;

  const fullName = getStaffFullName(member);

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!organizationId || !branchId) return;
    try {
      await resetPassword.mutateAsync({
        organizationId,
        branchId,
        staffId: member.id,
        password,
      });
      // Hand the typed password to the copyable success modal so the admin
      // can relay it, then close the input dialog.
      setCredentials({ email: member.email ?? "", password });
      toast.success(t("success", { name: fullName }));
      clearForm();
      onOpenChange(false);
    } catch {
      // useResetStaffPassword already surfaces a toast on error.
    }
  });

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            clearForm();
            onOpenChange(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
            <Dialog.Close
              aria-label={overviewT("cancel")}
              className="absolute end-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-black"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>

            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-brand-primary/10">
              <KeyRound className="size-5 text-brand-primary" aria-hidden="true" />
            </div>

            <Dialog.Title className="text-base font-semibold text-brand-black">
              {t("title")}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-gray-500">
              {t("description", { name: fullName, email: member.email ?? "" })}
            </Dialog.Description>

            <form onSubmit={onSubmit} className="mt-4">
              <label className="block">
                <span className="text-xs font-medium text-brand-black">
                  {t("passwordLabel")}
                </span>
                <div className="relative">
                  <input
                    {...register("password")}
                    className={cn(fieldClass, "pe-8")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 inset-e-0 flex items-center text-gray-400 hover:text-brand-black"
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showPassword ? (
                      <EyeOff className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className="pt-1 text-[11px] text-gray-400">{t("passwordHint")}</p>
                {errors.password?.message && (
                  <p className="pt-1 text-[11px] text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </label>

              <div className="mt-5 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {overviewT("cancel")}
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={resetPassword.isPending}
                  className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {resetPassword.isPending ? t("submitting") : t("submit")}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <DirectCreationSuccessModal
        credentials={credentials}
        title={t("successTitle")}
        hint={t("successHint")}
        onClose={() => setCredentials(null)}
      />
    </>
  );
}

export default StaffResetPasswordDialog;
