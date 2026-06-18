"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/common/utils/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  addOptionLabel: (v: string) => string;
}

export function CreatableSelect({ value, onChange, options, placeholder, addOptionLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

  const showCustom =
    query.trim() !== "" &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  function select(val: string) {
    onChange(val);
    setQuery("");
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) setQuery("");
    setOpen(next);
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors",
            "hover:border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
            open && "border-brand-primary ring-2 ring-brand-primary/10",
            !value && "text-gray-400",
          )}
        >
          <span className={cn("flex-1 truncate text-start", value ? "text-gray-700" : "text-gray-400")}>{value || placeholder}</span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-[50] w-[--radix-popover-trigger-width] rounded-lg border border-gray-200 bg-white shadow-lg outline-none"
          sideOffset={4}
          align="start"
          avoidCollisions
        >
          {/* Search */}
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm outline-none placeholder:text-gray-400"
              placeholder="Search…"
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto p-1">
            {showCustom && (
              <button
                type="button"
                onClick={() => select(query.trim())}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm text-brand-primary hover:bg-gray-50"
              >
                {addOptionLabel(query.trim())}
              </button>
            )}

            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => select(opt)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm text-gray-700 hover:bg-gray-50"
              >
                <Check
                  className={cn("size-3.5 shrink-0 text-brand-primary", value === opt ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
                {opt}
              </button>
            ))}

            {!showCustom && filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-gray-400">No results</p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
