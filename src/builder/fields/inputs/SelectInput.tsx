"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { FieldShell } from "../field-shell";
import { useDynamicOptions } from "../../runtime/useDynamicOptions";
import { useDefaultValue } from "../../runtime/useDefaultValue";
import type { FieldInputProps } from "../input-props";
import type { FieldOption } from "../../templates/template.types";

export function SelectInput({ field, value, onChange, required, disabled, error }: FieldInputProps) {
  const dynamic = useDynamicOptions(field);
  const options: FieldOption[] = useMemo(() => {
    if (dynamic.enabled) {
      return dynamic.options.map(({ code, label }) => ({ code, label }));
    }
    return (field.config?.validation?.options as FieldOption[] | undefined) ?? [];
  }, [dynamic.enabled, dynamic.options, field.config?.validation?.options]);
  const placeholder = (field.config?.ui?.placeholder as string | undefined) ?? "—";

  useDefaultValue(field, options);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selectedCode = typeof value === "string" ? value : "";
  const selected = useMemo(
    () => options.find((o) => o.code === selectedCode) ?? null,
    [options, selectedCode],
  );

  const isLoading = dynamic.isLoading;
  const isOptionsError = dynamic.isError;
  const triggerDisabled = disabled || isLoading;

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.code === selectedCode);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [open, options, selectedCode]);

  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function commit(code: string | null) {
    onChange(code);
    setOpen(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (triggerDisabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      if (open && activeIndex >= 0) {
        e.preventDefault();
        commit(options[activeIndex]?.code ?? null);
      } else if (!open) {
        e.preventDefault();
        setOpen(true);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <FieldShell label={field.label} required={required} error={error}>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={triggerDisabled}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={handleKey}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 border-0 border-b border-gray-200 bg-transparent px-0 text-xs outline-none transition-colors",
            "focus:border-brand-primary",
            open && "border-brand-primary",
            triggerDisabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span className={cn("truncate text-start", selected ? "text-brand-black" : "text-gray-300")}>
            {selected
              ? selected.label
              : isLoading
                ? "Loading…"
                : isOptionsError
                  ? "Failed to load"
                  : placeholder}
          </span>
          {isLoading ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-gray-400 transition-transform",
                open && "rotate-180 text-brand-primary",
              )}
              aria-hidden="true"
            />
          )}
        </button>

        {open ? (
          <div
            ref={listRef}
            role="listbox"
            className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {options.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-gray-400">
                {isOptionsError ? "Failed to load options" : "No options"}
              </p>
            ) : (
              <>
                {!required ? (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(null);
                    }}
                    className={cn(
                      "flex w-full items-center px-3 py-1.5 text-start text-xs text-gray-400 hover:bg-gray-50",
                      !selected && "bg-gray-50/60",
                    )}
                  >
                    {placeholder}
                  </button>
                ) : null}
                {options.map((opt, idx) => {
                  const isSelected = opt.code === selectedCode;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      data-idx={idx}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commit(opt.code);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-start text-xs transition-colors",
                        isActive && "bg-gray-50",
                        isSelected ? "font-medium text-brand-primary" : "text-brand-black",
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected ? (
                        <Check className="size-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}
