"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/infrastructure/http/api";
import { getSubscriptionLimit } from "@/common/errors/subscription-errors";
import { queryClient } from "@/infrastructure/query/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  createBranch,
  updateBranch,
  type CreateBranchRequest,
  type UpdateBranchRequest,
} from "../lib/settings.api";
import {
  branchFormSchema,
  type BranchFormData,
} from "../lib/settings.schemas";
import { DrawerActions } from "./settings-ui";
import {
  FieldLabel,
  fieldClass,
  type SettingsFormProps,
} from "./settings-form-shared";

export function BranchForm({
  activeDrawer,
  branches = [],
  branchId,
  cancelLabel,
  onDone,
  profile,
  t,
}: SettingsFormProps) {
  const isEdit = activeDrawer === "branchEdit";
  const targetBranch = isEdit
    ? (branches.find((b) => b.id === branchId) ?? branches[0])
    : undefined;

  const initial = useMemo<BranchFormData>(
    () => ({
      name: targetBranch?.name ?? "",
      address: targetBranch?.address ?? "",
      city: targetBranch?.city ?? "",
      governorate: targetBranch?.governorate ?? "",
      country: targetBranch?.country ?? "",
      is_main: targetBranch?.is_main ?? false,
    }),
    [targetBranch],
  );

  const [isMainTouched, setIsMainTouched] = useState(false);
  const onlyMain =
    isEdit &&
    targetBranch?.is_main === true &&
    branches.filter((b) => b.is_main).length <= 1;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: BranchFormData) {
    if (!profile?.organization.id) {
      toast.error(isEdit ? t("branches.updateError") : t("branches.createError"));
      return;
    }

    const wantsToDemoteOnlyMain =
      isEdit && onlyMain && isMainTouched && values.is_main === false;
    if (wantsToDemoteOnlyMain) {
      toast.error(t("branches.cannotDemoteOnlyMain"));
      return;
    }

    try {
      if (isEdit) {
        if (!targetBranch?.id) {
          toast.error(t("branches.updateError"));
          return;
        }
        const patch: UpdateBranchRequest = {};
        if (values.name !== initial.name) patch.name = values.name;
        if (values.address !== initial.address) patch.address = values.address;
        if (values.city !== initial.city) patch.city = values.city;
        if (values.governorate !== initial.governorate)
          patch.governorate = values.governorate;
        if ((values.country || "") !== (initial.country || "")) {
          patch.country = values.country || undefined;
        }
        if (isMainTouched && values.is_main !== initial.is_main) {
          patch.is_main = values.is_main;
        }

        if (Object.keys(patch).length === 0) {
          onDone();
          return;
        }

        await updateBranch(profile.organization.id, targetBranch.id, patch);
        toast.success(t("branches.updateSuccess"));
      } else {
        const body: CreateBranchRequest = {
          name: values.name,
          address: values.address,
          city: values.city,
          governorate: values.governorate,
          country: values.country || undefined,
          ...(values.is_main ? { is_main: true } : {}),
        };
        await createBranch(profile.organization.id, body);
        toast.success(t("branches.createSuccess"));
      }

      onDone();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.branches(profile.organization.id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() }),
      ]);
    } catch (error) {
      const limit = getSubscriptionLimit(error);
      if (limit?.resource === "branches") {
        toast.error(
          t("subscription.branchLimitReached", {
            current: limit.current,
            limit: limit.limit,
          }),
        );
      } else if (error instanceof ApiError && error.status === 400) {
        toast.error(t("branches.cannotDemoteOnlyMain"));
      } else {
        toast.error(
          isEdit ? t("branches.updateError") : t("branches.createError"),
        );
      }
    }
  }

  const currentMain = branches.find((b) => b.is_main && b.id !== targetBranch?.id);

  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-name" required>
          {t("fields.name")}
        </FieldLabel>
        <input
          id="branch-name"
          aria-required
          aria-invalid={!!errors.name}
          className={fieldClass(errors.name)}
          {...register("name")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-country">{t("fields.country")}</FieldLabel>
        <input
          id="branch-country"
          className={fieldClass(errors.country)}
          {...register("country")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-city" required>
          {t("fields.city")}
        </FieldLabel>
        <input
          id="branch-city"
          aria-required
          aria-invalid={!!errors.city}
          className={fieldClass(errors.city)}
          {...register("city")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-governorate" required>
          {t("fields.governorate")}
        </FieldLabel>
        <input
          id="branch-governorate"
          aria-required
          aria-invalid={!!errors.governorate}
          className={fieldClass(errors.governorate)}
          {...register("governorate")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-address" required>
          {t("fields.address")}
        </FieldLabel>
        <input
          id="branch-address"
          aria-required
          aria-invalid={!!errors.address}
          className={fieldClass(errors.address)}
          {...register("address")}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-black">
        <input
          type="checkbox"
          className="size-4 rounded border-gray-300"
          {...register("is_main", {
            onChange: () => setIsMainTouched(true),
          })}
        />
        <span>{t("fields.mainBranch")}</span>
      </label>
      {isEdit && currentMain && (
        <p className="text-xs text-gray-500">
          {t("branches.demoteWarning", { name: currentMain.name })}
        </p>
      )}
      {onlyMain && (
        <p className="text-xs text-amber-700">
          {t("branches.onlyMainHint")}
        </p>
      )}
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            <Pencil className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {isEdit ? t("branches.save") : t("branches.add")}
        </Button>
      </DrawerActions>
    </form>
  );
}
