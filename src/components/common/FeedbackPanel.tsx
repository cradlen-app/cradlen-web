"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Megaphone, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/common/errors/api-error";
import { BUILD_INFO } from "@/infrastructure/config/build-info";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useSubmitFeedback,
  type FeedbackCategory,
} from "./hooks/useSubmitFeedback";

const MIN_MESSAGE_LENGTH = 3;
const MAX_MESSAGE_LENGTH = 2000;
const CATEGORIES: FeedbackCategory[] = ["FEATURE", "BUG", "OTHER"];

/**
 * "Help us improve Cradlen" — an always-visible feedback entry point in the
 * sidebar. Renders the form inline when expanded, and as an icon → popover when
 * the sidebar is collapsed (a textarea can't fit the rail width).
 */
export function FeedbackPanel({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("feedback");
  const [open, setOpen] = useState(false);

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={t("title")}
          title={t("title")}
          className="flex w-full items-center justify-center rounded-xl px-0 py-2.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-primary"
        >
          <Megaphone className="size-4.5 shrink-0" />
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="end"
          className="w-72 p-3"
        >
          <FeedbackForm onDone={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <FeedbackForm />
    </div>
  );
}

function FeedbackForm({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const { mutate, isPending } = useSubmitFeedback();

  const [category, setCategory] = useState<FeedbackCategory>("FEATURE");
  const [message, setMessage] = useState("");
  const [creditConsent, setCreditConsent] = useState(false);

  const trimmed = message.trim();
  const canSubmit = trimmed.length >= MIN_MESSAGE_LENGTH && !isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    const pageUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "";

    mutate(
      {
        category,
        message: trimmed,
        creditConsent,
        pageUrl,
        appVersion: BUILD_INFO.version,
        locale,
      },
      {
        onSuccess: () => {
          toast.success(t("success"));
          setMessage("");
          setCreditConsent(false);
          setCategory("FEATURE");
          onDone?.();
        },
        onError: (error) => {
          const detail =
            error instanceof ApiError && typeof error.message === "string"
              ? error.message
              : t("error");
          toast.error(detail);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Megaphone className="size-4 shrink-0 text-brand-primary" />
        <p className="text-[13px] font-semibold text-brand-black">
          {t("title")}
        </p>
      </div>

      <Select
        value={category}
        onValueChange={(value) => setCategory(value as FeedbackCategory)}
      >
        <SelectTrigger className="h-8 w-full bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((value) => (
            <SelectItem key={value} value={value} className="text-xs">
              {t(`category.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={3}
        placeholder={t("placeholder")}
        className="resize-none bg-white text-xs"
      />

      <label className="flex items-start gap-2 text-[11px] leading-snug text-gray-500">
        <Checkbox
          checked={creditConsent}
          onCheckedChange={(value) => setCreditConsent(value === true)}
          className="mt-0.5"
        />
        <span>{t("consent")}</span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-medium text-white transition-colors",
          "hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        {isPending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
