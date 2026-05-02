"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SPECIALTIES = ["Pediatrics", "OB / GYN"];

interface SpecialtiesSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
}

export function SpecialtiesSelect({
  value,
  onChange,
  placeholder = "Select specialties",
  hasError,
}: SpecialtiesSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(specialty: string) {
    if (value.includes(specialty)) {
      onChange(value.filter((v) => v !== specialty));
    } else {
      onChange([...value, specialty]);
    }
  }

  function remove(specialty: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== specialty));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full min-h-[46px] rounded-xl border bg-white px-3 py-2 text-sm text-start",
          "flex flex-wrap items-center gap-1.5 outline-none transition-colors",
          "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
          hasError
            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
            : "border-gray-200",
        )}
      >
        {value.length === 0 ? (
          <span className="text-gray-400 flex-1">{placeholder}</span>
        ) : (
          value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary"
            >
              {s}
              <span
                role="button"
                aria-label={`Remove ${s}`}
                onClick={(e) => remove(s, e)}
                className="cursor-pointer hover:text-brand-primary/70"
              >
                <X className="size-3" />
              </span>
            </span>
          ))
        )}
        <ChevronDown
          className={cn(
            "ms-auto size-4 shrink-0 text-gray-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-md">
          {SPECIALTIES.map((specialty) => {
            const checked = value.includes(specialty);
            return (
              <button
                key={specialty}
                type="button"
                onClick={() => toggle(specialty)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  "hover:bg-brand-primary/5",
                  checked ? "text-brand-primary" : "text-brand-black",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-gray-300",
                  )}
                >
                  {checked && (
                    <svg viewBox="0 0 10 8" className="size-2.5 fill-current">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {specialty}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
