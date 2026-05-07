import { type FormEvent, useState } from "react";
import { SpecialtiesSelect } from "@/components/common/SpecialtiesSelect";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import { getProfilePrimaryRole, getProfileRoles } from "@/features/auth/lib/current-user";
import { queryClient } from "@/lib/queryClient";
import type { CurrentUser, UserProfile } from "@/types/user.types";
import {
  branchesQueryKey,
  createBranch,
  updateProfile,
  updateBranch,
  updateOrganization,
  type OrganizationBranch,
} from "../lib/settings.api";
import type { DrawerKey } from "./settings.types";
import {
  getFormBoolean,
  getFormString,
  hasRequiredValues,
  type SettingsT,
} from "./settings.utils";
import { DrawerActions, TextField } from "./settings-ui";

type SettingsFormProps = {
  activeDrawer: DrawerKey;
  branches?: OrganizationBranch[];
  branchId?: string;
  cancelLabel: string;
  onDone: () => void;
  profile?: UserProfile;
  t: SettingsT;
  user: CurrentUser;
};

export function ProfileForm({
  cancelLabel,
  onDone,
  profile,
  t,
  user,
}: SettingsFormProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!hasRequiredValues(form, ["firstName", "lastName"])) {
      toast.error(t("validation.required"));
      return;
    }

    if (!profile?.staff_id) {
      toast.error(t("profile.updateError"));
      return;
    }

    setIsPending(true);
    try {
      await updateProfile(profile.staff_id, {
        first_name: getFormString(form, "firstName"),
        last_name: getFormString(form, "lastName"),
        job_title: getFormString(form, "jobTitle") || undefined,
        phone_number: getFormString(form, "phone") || undefined,
        specialty: getFormString(form, "specialty") || undefined,
        is_clinical: getFormBoolean(form, "isClinical"),
      });
      toast.success(t("profile.updateSuccess"));
      onDone();
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } catch {
      toast.error(t("profile.updateError"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <TextField
        defaultValue={user.first_name}
        id="settings-first-name"
        label={t("fields.firstName")}
        name="firstName"
        required
      />
      <TextField
        defaultValue={user.last_name}
        id="settings-last-name"
        label={t("fields.lastName")}
        name="lastName"
        required
      />
      <TextField
        defaultValue={profile?.job_title}
        id="settings-job-title"
        label={t("fields.jobTitle")}
        name="jobTitle"
      />
      <TextField
        defaultValue={profile?.phone_number ?? profile?.phone ?? user.phone_number ?? user.phone ?? ""}
        id="settings-phone"
        label={t("fields.phone")}
        name="phone"
      />
      {(getProfilePrimaryRole(profile) === STAFF_ROLE.DOCTOR ||
        (profile?.organization?.specialities?.length ?? 0) > 0) && (
        <TextField
          defaultValue={profile?.specialty ?? ""}
          id="settings-specialty"
          label={t("fields.specialty")}
          name="specialty"
        />
      )}
      <label className="flex items-center gap-2 text-sm text-brand-black">
        <input
          defaultChecked={profile?.is_clinical ?? getProfileRoles(profile).includes(STAFF_ROLE.DOCTOR)}
          name="isClinical"
          type="checkbox"
          className="size-4 rounded border-gray-300"
        />
        <span>{t("fields.isClinical")}</span>
      </label>
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t("profile.save")}
        </Button>
      </DrawerActions>
    </form>
  );
}

export function OrganizationForm({
  cancelLabel,
  onDone,
  profile,
  t,
}: SettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>(
    profile?.organization.specialities ?? [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!hasRequiredValues(form, ["organizationName"])) {
      toast.error(t("validation.required"));
      return;
    }

    if (!specialties.length) {
      toast.error(t("validation.required"));
      return;
    }

    if (!profile?.organization.id) {
      toast.error(t("organization.updateError"));
      return;
    }

    setIsPending(true);
    try {
      await updateOrganization(profile.organization.id, {
        name: getFormString(form, "organizationName"),
        specialities: specialties,
      });
      toast.success(t("organization.updateSuccess"));
      onDone();
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } catch {
      toast.error(t("organization.updateError"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <TextField
        defaultValue={profile?.organization.name}
        id="organization-name"
        label={t("fields.organizationName")}
        name="organizationName"
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-brand-black">
          {t("fields.specialties")}
          <span className="ms-0.5 text-red-500">*</span>
        </label>
        <SpecialtiesSelect value={specialties} onChange={setSpecialties} />
      </div>
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Pencil className="size-4" />
          )}
          {t("organization.save")}
        </Button>
      </DrawerActions>
    </form>
  );
}

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
  const [isPending, setIsPending] = useState(false);
  const targetBranch = isEdit
    ? (branches.find((b) => b.id === branchId) ?? branches[0])
    : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const requiredFields = isEdit
      ? ["city", "governorate", "address"]
      : ["branchName", "city", "governorate", "address"];

    if (!hasRequiredValues(form, requiredFields)) {
      toast.error(t("validation.required"));
      return;
    }

    if (!profile?.organization.id) {
      toast.error(
        isEdit ? t("branches.updateError") : t("branches.createError"),
      );
      return;
    }

    setIsPending(true);
    try {
      if (isEdit) {
        if (!targetBranch?.id) {
          toast.error(t("branches.updateError"));
          return;
        }

        await updateBranch(profile.organization.id, targetBranch.id, {
          name: getFormString(form, "branchName") || undefined,
          country: getFormString(form, "country") || undefined,
          city: getFormString(form, "city"),
          governorate: getFormString(form, "governorate"),
          address: getFormString(form, "address"),
          is_main: getFormBoolean(form, "isMain"),
        });
        toast.success(t("branches.updateSuccess"));
      } else {
        await createBranch(profile.organization.id, {
          name: getFormString(form, "branchName"),
          country: getFormString(form, "country") || undefined,
          city: getFormString(form, "city"),
          governorate: getFormString(form, "governorate"),
          address: getFormString(form, "address"),
          is_main: getFormBoolean(form, "isMain"),
        });
        toast.success(t("branches.createSuccess"));
      }

      onDone();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: branchesQueryKey(profile.organization.id),
        }),
      ]);
    } catch {
      toast.error(
        isEdit ? t("branches.updateError") : t("branches.createError"),
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <TextField
        defaultValue={isEdit ? (targetBranch?.name ?? "") : ""}
        id="branch-name"
        label={t("fields.name")}
        name="branchName"
        required={!isEdit}
      />
      <TextField
        defaultValue={isEdit ? (targetBranch?.country ?? "") : ""}
        id="branch-country"
        label={t("fields.country")}
        name="country"
      />
      <TextField
        defaultValue={isEdit ? targetBranch?.city : ""}
        id="branch-city"
        label={t("fields.city")}
        name="city"
        required
      />
      <TextField
        defaultValue={isEdit ? targetBranch?.governorate : ""}
        id="branch-governorate"
        label={t("fields.governorate")}
        name="governorate"
        required
      />
      <TextField
        defaultValue={isEdit ? targetBranch?.address : ""}
        id="branch-address"
        label={t("fields.address")}
        name="address"
        required
      />
      <label className="flex items-center gap-2 text-sm text-brand-black">
        <input
          defaultChecked={isEdit && targetBranch?.is_main}
          name="isMain"
          type="checkbox"
          className="size-4 rounded border-gray-300"
        />
        <span>{t("fields.mainBranch")}</span>
      </label>
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isPending ? (
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
