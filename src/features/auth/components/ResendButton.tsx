"use client";

type ResendButtonProps = {
  cooldownSeconds: number;
  isPending: boolean;
  onClick: () => void;
  resendLabel: string;
  pendingLabel: string;
  cooldownLabel: (seconds: number) => string;
};

export function ResendButton({
  cooldownSeconds,
  isPending,
  onClick,
  resendLabel,
  pendingLabel,
  cooldownLabel,
}: ResendButtonProps) {
  const disabled = isPending || cooldownSeconds > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-center text-sm text-brand-secondary underline underline-offset-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
    >
      {isPending
        ? pendingLabel
        : cooldownSeconds > 0
          ? cooldownLabel(cooldownSeconds)
          : resendLabel}
    </button>
  );
}
