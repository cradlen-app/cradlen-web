"use client";

import { useRef } from "react";
import { Building2, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import type { UserProfile } from "@/common/types/user.types";
import {
  useRemoveOrganizationLogo,
  useUploadOrganizationLogo,
} from "../hooks/useOrganizationLogo";
import type { SettingsT } from "./settings.utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function OrganizationLogoUploader({
  organization,
  t,
}: {
  organization: UserProfile["organization"];
  t: SettingsT;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const organizationId = organization?.id;
  const logoUrl = organization?.logo_image_url ?? null;
  const name = organization?.name ?? "";

  const upload = useUploadOrganizationLogo(organizationId);
  const remove = useRemoveOrganizationLogo(organizationId);
  const busy = upload.isPending || remove.isPending;

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(t("profile.imageTypeError"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("profile.imageTooLarge"));
      return;
    }

    upload.mutate(file, {
      onSuccess: () => toast.success(t("organization.logoUpdated")),
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? (error.messages[0] ?? t("organization.updateError"))
            : t("organization.updateError"),
        ),
    });
  };

  const onRemove = () => {
    remove.mutate(undefined, {
      onSuccess: () => toast.success(t("organization.logoRemoved")),
      onError: () => toast.error(t("organization.updateError")),
    });
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white/50 p-4">
      <div className="relative size-16 shrink-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="size-16 rounded-xl object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Building2 className="size-7" />
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
            <Loader2 className="size-5 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-brand-black">
          {name || t("organization.logo")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-brand-black hover:bg-gray-50 disabled:opacity-50",
            )}
          >
            <Camera className="size-3.5" />
            {logoUrl ? t("organization.changeLogo") : t("organization.addLogo")}
          </button>
          {logoUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              {t("organization.removeLogo")}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
