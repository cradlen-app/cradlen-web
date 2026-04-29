"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  length?: number;
  ariaLabel: string;
};

export function OTPInput({
  value,
  onChange,
  onBlur,
  error = false,
  disabled = false,
  length = 6,
  ariaLabel,
}: OTPInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const updateDigit = (index: number, digit: string) => {
    const nextDigits = digits.map((item) => (item === " " ? "" : item));
    nextDigits[index] = digit;
    onChange(nextDigits.join("").slice(0, length));
  };

  return (
    <div className="flex justify-center gap-2" dir="ltr" aria-label={ariaLabel}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit === " " ? "" : digit}
          onBlur={onBlur}
          onChange={(event) => {
            const nextDigit = event.target.value.replace(/\D/g, "").slice(-1);
            updateDigit(index, nextDigit);
            if (nextDigit && index < length - 1) {
              inputRefs.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index].trim() && index > 0) {
              inputRefs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, length);

            if (!pasted) return;

            onChange(pasted);
            inputRefs.current[Math.min(pasted.length, length) - 1]?.focus();
          }}
          className={cn(
            "size-12 rounded-xl border bg-white text-center text-lg font-semibold text-brand-black outline-none transition-colors",
            "border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          )}
        />
      ))}
    </div>
  );
}
