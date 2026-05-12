"use client";

import { useState } from "react";
import { Mail, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEFAULT_ENGAGEMENT_TYPE } from "@/features/auth/lib/auth.constants";
import { ApiError } from "@/infrastructure/http/api";
import { cn } from "@/common/utils/utils";
import { useBulkInviteStaff } from "../hooks/useBulkInviteStaff";
import { useResendStaffInvitation } from "../hooks/useStaffInvitations";
import { useStaffRoles } from "../hooks/useStaffRoles";
import { splitStaffName } from "../lib/staff-invite.schemas";
import type {
  BulkInviteResultRow,
  InviteStaffRequest,
} from "../types/staff.api.types";

type Props = {
  branchId?: string;
  branchName?: string;
  organizationId?: string;
  organizationName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ParsedRow = {
  email: string;
  name: string;
  raw: string;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseLines(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map<ParsedRow>((line) => {
      // Accept "Name, email" or "email,Name" or just "email" or "email\tName".
      const parts = line.split(/[,\t]/).map((p) => p.trim()).filter(Boolean);
      let email = "";
      let name = "";
      for (const p of parts) {
        if (!email && EMAIL_RE.test(p)) email = p;
        else if (!name) name = p;
      }
      if (!email && parts.length === 1 && EMAIL_RE.test(parts[0])) {
        email = parts[0];
      }
      const error = !email
        ? "Missing valid email"
        : splitStaffName(name).lastName === "" && name !== ""
          ? undefined
          : !name
            ? "Missing name"
            : splitStaffName(name).lastName === ""
              ? "Enter first and last name"
              : undefined;
      return { email, name, raw: line, error };
    });
}

export function StaffBulkInviteDrawer({
  branchId,
  branchName,
  organizationId,
  organizationName,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("staff.create");
  const bulkT = useTranslations("staff.create.bulk");
  const bulkMutation = useBulkInviteStaff();
  const resendMutation = useResendStaffInvitation();
  const { data: roleFilters = [] } = useStaffRoles(organizationId);
  const defaultRoleId =
    roleFilters.find((r) => r.role === "STAFF")?.id ?? roleFilters[0]?.id ?? "";

  const [text, setText] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [results, setResults] = useState<BulkInviteResultRow[] | null>(null);

  const effectiveRoleId = roleId || defaultRoleId;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setText("");
      setRoleId("");
      setResults(null);
    }
    onOpenChange(next);
  }

  const parsed = parseLines(text);
  const validRows = parsed.filter((r) => !r.error);
  const invalidCount = parsed.length - validRows.length;

  async function handleSubmit() {
    if (!organizationId || !branchId) {
      toast.error(t("missingOrganization"));
      return;
    }
    if (!effectiveRoleId) {
      toast.error(bulkT("roleRequired"));
      return;
    }
    if (validRows.length === 0) return;

    const invitations: InviteStaffRequest[] = validRows.map((row) => {
      const { firstName, lastName } = splitStaffName(row.name);
      return {
        email: row.email,
        first_name: firstName,
        last_name: lastName,
        role_ids: [effectiveRoleId],
        branch_ids: [branchId],
        engagement_type: DEFAULT_ENGAGEMENT_TYPE,
      };
    });

    try {
      const response = await bulkMutation.mutateAsync({
        organizationId,
        data: { invitations },
      });
      setResults(response.data.results);
      toast.success(bulkT("created", { count: response.data.created }));
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.messages[0] ?? bulkT("error"));
      } else {
        toast.error(bulkT("error"));
      }
    }
  }

  async function handleResend(row: BulkInviteResultRow) {
    if (!organizationId) return;
    try {
      await resendMutation.mutateAsync({
        organizationId,
        invitationId: row.id,
      });
      setResults(
        (prev) =>
          prev?.map((r) => (r.id === row.id ? { ...r, email_sent: true } : r)) ?? null,
      );
    } catch {
      // mutation onError already toasts
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-107.5 sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-lg font-medium text-brand-black">
              {bulkT("title")}
            </Dialog.Title>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label={bulkT("close")}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {organizationName} · {branchName}
          </div>

          <div className="mt-6 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {!results && (
              <>
                <div>
                  <label className="block text-xs font-medium text-brand-black">
                    {bulkT("roleLabel")}
                  </label>
                  <select
                    value={effectiveRoleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="mt-1 h-9 w-full border-0 border-b border-gray-200 bg-transparent text-xs outline-none focus:border-brand-primary"
                  >
                    {roleFilters
                      .filter((r) => r.role !== "UNKNOWN" && r.role !== "OWNER")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-black">
                    {bulkT("inviteesLabel")}
                  </label>
                  <p className="text-[11px] text-gray-400">{bulkT("formatHint")}</p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={10}
                    placeholder={"Mona Hassan, mona@example.com\nahmed.fouad@example.com, Ahmed Fouad"}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                  />
                </div>

                {parsed.length > 0 && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                    <p className="text-xs font-medium text-brand-black">
                      {bulkT("preview", {
                        valid: validRows.length,
                        invalid: invalidCount,
                      })}
                    </p>
                    {invalidCount > 0 && (
                      <ul className="mt-2 space-y-1 text-[11px] text-red-500">
                        {parsed
                          .filter((r) => r.error)
                          .map((r, i) => (
                            <li key={i}>
                              <span className="font-mono text-gray-500">{r.raw}</span>
                              {" — "}
                              {r.error}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}

            {results && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-black">
                  {bulkT("resultsTitle")}
                </p>
                <ul className="space-y-1 text-xs">
                  {results.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Mail className="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                        <span className="truncate text-brand-black">{row.email}</span>
                      </div>
                      {row.email_sent ? (
                        <span className="text-[11px] text-emerald-600">
                          {bulkT("sent")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResend(row)}
                          disabled={resendMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={cn(
                              "size-3",
                              resendMutation.isPending && "animate-spin",
                            )}
                            aria-hidden="true"
                          />
                          {bulkT("resend")}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            {results ? (
              <Button type="button" onClick={() => onOpenChange(false)}>
                {bulkT("done")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t("close")}
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={validRows.length === 0 || bulkMutation.isPending}
                >
                  {bulkMutation.isPending
                    ? bulkT("sending")
                    : bulkT("send", { count: validRows.length })}
                </Button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
