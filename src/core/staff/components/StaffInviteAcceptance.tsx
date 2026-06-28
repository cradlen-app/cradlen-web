"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { staffQueryKeys } from "../queryKeys";
import { getInvitationPreview } from "../lib/staff.api";
import { getPreviewErrorKey } from "./staff-invite.helpers";
import { PreviewStep } from "./StaffInvitePreviewStep";
import { AcceptStep } from "./StaffInviteAcceptStep";

// — Loading skeleton —

function InviteSkeleton() {
  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-100 mx-auto" />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
      <div className="h-11 animate-pulse rounded-full bg-gray-100" />
    </div>
  );
}

// — Root component —

export function StaffInviteAcceptance() {
  const t = useTranslations("staff.invite");
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const invitationId =
    searchParams.get("invitation") ?? searchParams.get("invite") ?? "";
  const hasParams = Boolean(token && invitationId);

  const [step, setStep] = useState<"preview" | "accept">("preview");

  const previewQuery = useQuery({
    queryKey: staffQueryKeys.invitationPreview(invitationId, token),
    queryFn: () => getInvitationPreview(invitationId, token),
    enabled: hasParams,
    retry: false,
  });

  if (!hasParams) {
    return (
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-red-600">
          {t("errors.missing")}
        </div>
      </div>
    );
  }

  if (previewQuery.isLoading) {
    return <InviteSkeleton />;
  }

  if (previewQuery.isError || !previewQuery.data?.data) {
    return (
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-red-600">
          {t(`errors.${getPreviewErrorKey(previewQuery.error)}`)}
        </div>
      </div>
    );
  }

  const preview = previewQuery.data.data;

  if (step === "accept") {
    return (
      <AcceptStep
        preview={preview}
        token={token}
        invitationId={invitationId}
        onBack={() => setStep("preview")}
      />
    );
  }

  return (
    <PreviewStep
      preview={preview}
      token={token}
      invitationId={invitationId}
      onAccept={() => setStep("accept")}
    />
  );
}
