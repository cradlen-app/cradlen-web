"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import type { UserProfile } from "@/common/types/user.types";
import {
  useRemoveProfileImage,
  useUploadProfileImage,
} from "../hooks/useProfileImage";
import { ImageCropModal } from "./ImageCropModal";
import type { SettingsT } from "./settings.utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function StaffAvatarUploader({
  profile,
  displayName,
  t,
}: {
  profile: UserProfile;
  displayName: string;
  t: SettingsT;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const profileId = profile.staff_id;
  const organizationId = profile.organization?.id;
  const imageUrl = profile.profile_image_url ?? null;

  const upload = useUploadProfileImage(profileId, organizationId);
  const remove = useRemoveProfileImage(profileId, organizationId);
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

    setPendingFile(file);
  };

  const onCropped = (file: File) => {
    upload.mutate(file, {
      onSuccess: () => {
        toast.success(t("profile.imageUpdated"));
        setPendingFile(null);
      },
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? (error.messages[0] ?? t("profile.updateError"))
            : t("profile.updateError"),
        ),
    });
  };

  const onRemove = () => {
    remove.mutate(undefined, {
      onSuccess: () => toast.success(t("profile.imageRemoved")),
      onError: () => toast.error(t("profile.updateError")),
    });
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white/50 p-4">
      <div className="relative size-16 shrink-0">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={displayName}
            className="size-16 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-brand-primary/10 text-xl font-bold text-brand-primary">
            {initials(displayName)}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
            <Loader2 className="size-5 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-brand-black">
          {displayName}
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
            {imageUrl ? t("profile.changePhoto") : t("profile.addPhoto")}
          </button>
          {imageUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              {t("profile.removePhoto")}
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

      <ImageCropModal
        open={pendingFile !== null}
        onOpenChange={(open) => {
          if (!open && !upload.isPending) setPendingFile(null);
        }}
        file={pendingFile}
        shape="round"
        fileName="avatar.webp"
        busy={upload.isPending}
        onCropped={onCropped}
        labels={{
          title: t("imageCrop.titlePhoto"),
          description: t("imageCrop.description"),
          zoom: t("imageCrop.zoom"),
          rotate: t("imageCrop.rotate"),
          cancel: t("imageCrop.cancel"),
          save: t("imageCrop.save"),
          error: t("imageCrop.error"),
        }}
      />
    </div>
  );
}
