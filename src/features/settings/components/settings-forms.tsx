import type { FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import { queryClient } from "@/lib/queryClient";
import type { CurrentUser, UserProfile } from "@/types/user.types";
import {
  createBranch,
  createOrganization,
  updateAccountProfile,
  updateBranch,
  updateOrganization,
} from "../lib/settings.api";
import type { DrawerKey } from "./settings.types";
import {
  getFormBoolean,
  getFormString,
  getSpecialities,
  hasRequiredValues,
  type SettingsT,
} from "./settings.utils";
import { DrawerActions, TextField } from "./settings-ui";

type SettingsFormProps = {
  activeDrawer: DrawerKey;
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
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!hasRequiredValues(form, ["firstName", "lastName"])) {
      toast.error(t("validation.required"));
      return;
    }

    try {
      await updateAccountProfile({
        first_name: getFormString(form, "firstName"),
        last_name: getFormString(form, "lastName"),
        job_title: getFormString(form, "jobTitle") || undefined,
        organization_id: profile?.organization.id,
        phone_number: getFormString(form, "phone") || undefined,
        specialty: getFormString(form, "specialty") || undefined,
      });
      toast.success(t("profile.updateSuccess"));
      onDone();
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } catch {
      toast.error(t("profile.updateError"));
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
        defaultValue={user.phone_number ?? user.phone ?? ""}
        id="settings-phone"
        label={t("fields.phone")}
        name="phone"
      />
      {(profile?.role.name === "doctor" ||
        (profile?.organization?.specialities?.length ?? 0) > 0) && (
        <TextField
          defaultValue={profile?.specialty ?? ""}
          id="settings-specialty"
          label={t("fields.specialty")}
          name="specialty"
        />
      )}
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {t("profile.save")}
        </Button>
      </DrawerActions>
    </form>
  );
}

export function OrganizationForm({
  activeDrawer,
  cancelLabel,
  onDone,
  profile,
  t,
}: SettingsFormProps) {
  const isEdit = activeDrawer === "organizationEdit";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const requiredFields = isEdit
      ? ["organizationName", "specialties"]
      : [
          "organizationName",
          "specialties",
          "country",
          "city",
          "governorate",
          "address",
        ];

    if (!hasRequiredValues(form, requiredFields)) {
      toast.error(t("validation.required"));
      return;
    }

    try {
      const specialities = getSpecialities(getFormString(form, "specialties"));

      if (isEdit) {
        if (!profile?.organization.id) {
          toast.error(t("organization.updateError"));
          return;
        }

        await updateOrganization(profile.organization.id, {
          name: getFormString(form, "organizationName"),
          specialities,
        });
        toast.success(t("organization.updateSuccess"));
      } else {
        await createOrganization({
          name: getFormString(form, "organizationName"),
          specialities,
          country: getFormString(form, "country"),
          city: getFormString(form, "city"),
          governorate: getFormString(form, "governorate"),
          address: getFormString(form, "address"),
          is_clinical: getFormBoolean(form, "isClinical"),
          job_title: getFormString(form, "jobTitle") || undefined,
          specialty: getFormString(form, "specialty") || undefined,
        });
        toast.success(t("organization.createSuccess"));
      }

      onDone();
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } catch {
      toast.error(
        isEdit ? t("organization.updateError") : t("organization.createError"),
      );
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <TextField
        defaultValue={isEdit ? profile?.organization.name : ""}
        id="organization-name"
        label={t("fields.organizationName")}
        name="organizationName"
        required
      />
      <TextField
        defaultValue={
          isEdit ? profile?.organization.specialities?.join(", ") : ""
        }
        id="organization-specialties"
        label={t("fields.specialties")}
        name="specialties"
        required
      />
      {!isEdit && (
        <>
          <TextField
            id="organization-country"
            label={t("fields.country")}
            name="country"
            required
          />
          <TextField
            id="organization-city"
            label={t("fields.city")}
            name="city"
            required
          />
          <TextField
            id="organization-governorate"
            label={t("fields.governorate")}
            name="governorate"
            required
          />
          <TextField
            id="organization-address"
            label={t("fields.address")}
            name="address"
            required
          />
          <label className="flex items-center gap-2 text-sm text-brand-black">
            <input
              name="isClinical"
              type="checkbox"
              className="size-4 rounded border-gray-300"
            />
            <span>{t("fields.isClinical")}</span>
          </label>
          <TextField
            id="organization-specialty"
            label={t("fields.specialty")}
            name="specialty"
          />
          <TextField
            id="organization-job-title"
            label={t("fields.jobTitle")}
            name="jobTitle"
          />
        </>
      )}
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {isEdit ? t("organization.save") : t("organization.add")}
        </Button>
      </DrawerActions>
    </form>
  );
}

export function BranchForm({
  activeDrawer,
  cancelLabel,
  onDone,
  profile,
  t,
}: SettingsFormProps) {
  const isEdit = activeDrawer === "branchEdit";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const requiredFields = isEdit
      ? ["city", "governorate", "address"]
      : ["country", "city", "governorate", "address"];

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

    try {
      if (isEdit) {
        if (!profile.branch?.id) {
          toast.error(t("branches.updateError"));
          return;
        }

        await updateBranch(profile.branch.id, profile.organization.id, {
          country: getFormString(form, "country") || undefined,
          city: getFormString(form, "city"),
          governorate: getFormString(form, "governorate"),
          address: getFormString(form, "address"),
          is_main: getFormBoolean(form, "isMain"),
        });
        toast.success(t("branches.updateSuccess"));
      } else {
        await createBranch({
          organization_id: profile.organization.id,
          country: getFormString(form, "country") || undefined,
          city: getFormString(form, "city"),
          governorate: getFormString(form, "governorate"),
          address: getFormString(form, "address"),
          is_main: getFormBoolean(form, "isMain"),
        });
        toast.success(t("branches.createSuccess"));
      }

      onDone();
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } catch {
      toast.error(
        isEdit ? t("branches.updateError") : t("branches.createError"),
      );
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <TextField
        defaultValue={isEdit ? profile?.branch.country : ""}
        id="branch-country"
        label={t("fields.country")}
        name="country"
        required={!isEdit}
      />
      <TextField
        defaultValue={isEdit ? profile?.branch.city : ""}
        id="branch-city"
        label={t("fields.city")}
        name="city"
        required
      />
      <TextField
        defaultValue={isEdit ? profile?.branch.governorate : ""}
        id="branch-governorate"
        label={t("fields.governorate")}
        name="governorate"
        required
      />
      <TextField
        defaultValue={isEdit ? profile?.branch.address : ""}
        id="branch-address"
        label={t("fields.address")}
        name="address"
        required
      />
      <label className="flex items-center gap-2 text-sm text-brand-black">
        <input
          defaultChecked={isEdit && profile?.branch.is_main}
          name="isMain"
          type="checkbox"
          className="size-4 rounded border-gray-300"
        />
        <span>{t("fields.mainBranch")}</span>
      </label>
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {isEdit ? t("branches.save") : t("branches.add")}
        </Button>
      </DrawerActions>
    </form>
  );
}
