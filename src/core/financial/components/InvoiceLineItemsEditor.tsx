"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  type Control,
  type UseFormSetValue,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { Trash2, Plus, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "../lib/format";
import { useResolvePrice } from "../hooks/useResolvePrice";
import { useProviderServices } from "../hooks/useAuthorizations";
import { InvoicePricingSourceBadge } from "./InvoicePricingSourceBadge";
import type { InvoiceFormValues } from "./invoice-form.schema";

type ServiceOption = { id: string; name: string; code: string };

type Props = {
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  /** Shared field array from the parent form — single source so imports re-render. */
  fields: FieldArrayWithId<InvoiceFormValues, "items", "id">[];
  append: UseFieldArrayAppend<InvoiceFormValues, "items">;
  remove: UseFieldArrayRemove;
  branchId: string;
  /** Provider whose authorized services populate the picker + drive pricing. */
  profileId?: string;
  /** Display currency for line-total formatting. Defaults to "EGP". */
  currency?: string | null;
};

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

const EMPTY_SERVICE_ROW = {
  service_id: "",
  description: "",
  quantity: 1,
  unit_price: 0,
  discount_amount: undefined,
  pricing_source: undefined,
};

function LineItemRow({
  index,
  control,
  setValue,
  branchId,
  profileId,
  currency,
  options,
  onRemove,
}: {
  index: number;
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  branchId: string;
  profileId?: string;
  currency?: string | null;
  options: ServiceOption[];
  onRemove: () => void;
}) {
  const t = useTranslations("financial.invoice.lineItems");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Only set when the user picks here — keeps imported rows' captured price.
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const { resolvedPrice, isLoading: isPriceLoading } = useResolvePrice(
    selectedServiceId,
    branchId,
    profileId,
  );

  useEffect(() => {
    if (resolvedPrice && selectedServiceId) {
      setValue(`items.${index}.unit_price`, resolvedPrice.price);
      setValue(`items.${index}.pricing_source`, resolvedPrice.source);
    }
  }, [resolvedPrice, selectedServiceId, index, setValue]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q),
    );
  }, [query, options]);

  return (
    <Controller
      control={control}
      name={`items.${index}`}
      render={({ field }) => {
        const item = field.value;
        const qty = item.quantity || 1;
        const unitPrice = item.unit_price || 0;
        const lineTotal = qty * unitPrice;
        const priceLocked = !!resolvedPrice && !!selectedServiceId;

        function handleSelect(svc: ServiceOption) {
          setSelectedServiceId(svc.id);
          field.onChange({ ...item, service_id: svc.id, description: svc.name });
          setQuery("");
          setOpen(false);
        }

        return (
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            {/* Service combobox */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(inputClass, "flex items-center justify-between gap-2 text-left")}
              >
                <span className={cn("truncate", !item.description && "text-gray-400")}>
                  {item.description || t("selectService")}
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
              </button>

              {open && (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setOpen(false)}
                  />
                  <div className="absolute start-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 p-2">
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("searchService")}
                        className={cn(inputClass, "h-8 py-1")}
                      />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-gray-400">
                          {t("noAuthorizedServices")}
                        </li>
                      ) : (
                        filtered.map((svc) => (
                          <li key={svc.id}>
                            <button
                              type="button"
                              onMouseDown={() => handleSelect(svc)}
                              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <span className="truncate text-gray-900">{svc.name}</span>
                              <span className="shrink-0 text-[11px] text-gray-400">
                                {svc.code}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Qty · Unit price · Total · Remove */}
            <div className="flex items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-gray-400">{t("qty")}</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    field.onChange({
                      ...item,
                      quantity: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className={cn(inputClass, "w-16 text-center")}
                  aria-label={t("qty")}
                />
              </label>

              <label className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] text-gray-400">{t("unitPrice")}</span>
                {isPriceLoading && selectedServiceId ? (
                  <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
                ) : (
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      field.onChange({
                        ...item,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    readOnly={priceLocked}
                    className={cn(inputClass, priceLocked && "bg-gray-50 text-gray-500")}
                    placeholder={t("unitPricePlaceholder")}
                    aria-label={t("unitPrice")}
                  />
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-gray-400">{t("total")}</span>
                <div className="flex h-9 min-w-[96px] items-center justify-end rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700">
                  {formatMoney(lineTotal, currency)}
                </div>
              </label>

              <button
                type="button"
                onClick={onRemove}
                className="mb-px inline-flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label={t("removeItemAria")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            {item.pricing_source ? (
              <InvoicePricingSourceBadge source={item.pricing_source} />
            ) : selectedServiceId && !isPriceLoading ? (
              <span className="text-[11px] text-amber-600">
                {t("noPriceConfigured")}
              </span>
            ) : null}
          </div>
        );
      }}
    />
  );
}

export function InvoiceLineItemsEditor({
  control,
  setValue,
  fields,
  append,
  remove,
  branchId,
  profileId,
  currency,
}: Props) {
  const t = useTranslations("financial.invoice.lineItems");
  const { authorizations } = useProviderServices(profileId);

  const options = useMemo<ServiceOption[]>(
    () =>
      authorizations
        .filter((a) => a.service)
        .map((a) => ({
          id: a.service!.id,
          name: a.service!.name,
          code: a.service!.code,
        })),
    [authorizations],
  );

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <LineItemRow
          key={field.id}
          index={index}
          control={control}
          setValue={setValue}
          branchId={branchId}
          profileId={profileId}
          currency={currency}
          options={options}
          onRemove={() => remove(index)}
        />
      ))}

      {fields.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          {t("noItems")}
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...EMPTY_SERVICE_ROW })}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addService")}
        </Button>
      </div>
    </div>
  );
}
