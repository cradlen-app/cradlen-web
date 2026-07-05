"use client";

import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ISO_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "d MMM yyyy";

function parseIso(value: string): Date | undefined {
  if (!value) return undefined;
  // Backend date fields may arrive as full ISO datetimes ("1999-09-01T00:00:00.000Z");
  // slice to the date portion so strict yyyy-MM-dd parsing succeeds (timezone-safe).
  const parsed = parse(value.slice(0, 10), ISO_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

type DateOfBirthPickerProps = {
  id: string;
  label: string;
  placeholder: string;
  /** ISO date string (yyyy-MM-dd) or empty when unset. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputClassName?: string;
  errorInputClassName?: string;
};

export function DateOfBirthPicker({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  inputClassName,
  errorInputClassName,
}: DateOfBirthPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const today = new Date();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-brand-black">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className={cn(
              inputClassName,
              "flex items-center justify-between gap-2 text-left",
              !selected && "text-gray-400",
              !!error && errorInputClassName,
            )}
          >
            <span>{selected ? format(selected, DISPLAY_FORMAT) : placeholder}</span>
            <CalendarIcon className="size-4 shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" portal={false}>
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected ?? new Date(today.getFullYear() - 30, 0)}
            startMonth={new Date(1920, 0)}
            endMonth={today}
            disabled={{ after: today }}
            onSelect={(date) => {
              onChange(date ? format(date, ISO_FORMAT) : "");
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
