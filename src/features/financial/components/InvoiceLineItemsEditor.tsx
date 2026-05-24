"use client";

import { useState, useEffect } from "react";
import { useFieldArray, Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { fetchServices } from "../lib/services.api";
import { formatMoney } from "../lib/format";
import { useResolvePrice } from "../hooks/useResolvePrice";
import { InvoicePricingSourceBadge } from "./InvoicePricingSourceBadge";
import type { InvoiceFormValues } from "./InvoiceDrawer";

type Props = {
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  orgId: string;
  branchId: string;
  profileId?: string;
  /** Display currency for line-total formatting. Defaults to "EGP". */
  currency?: string | null;
};

type ServiceOption = {
  id: string;
  name: string;
};

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

function LineItemRow({
  index,
  control,
  setValue,
  orgId,
  branchId,
  profileId,
  currency,
  onRemove,
  isCustom,
}: {
  index: number;
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  orgId: string;
  branchId: string;
  profileId?: string;
  currency?: string | null;
  onRemove: () => void;
  isCustom: boolean;
}) {
  const t = useTranslations("financial.invoice.lineItems");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch services when search changes.
  // Backend `ListServicesQueryDto` does not support a `search` filter — we fetch
  // active services and filter client-side by name/code. `service` is included
  // in the paginated payload (see PaginatedResponse shape).
  useEffect(() => {
    if (!debouncedSearch || isCustom) return;
    const needle = debouncedSearch.toLowerCase();
    fetchServices(orgId, { active: true, limit: 100 })
      .then((res) =>
        setServiceOptions(
          res.data
            .filter(
              (s) =>
                s.name.toLowerCase().includes(needle) ||
                s.code.toLowerCase().includes(needle),
            )
            .map((s) => ({ id: s.id, name: s.name })),
        ),
      )
      .catch(() => setServiceOptions([]));
  }, [debouncedSearch, orgId, isCustom]);

  const { resolvedPrice, isLoading: isPriceLoading } = useResolvePrice(
    selectedServiceId,
    branchId,
    profileId,
  );

  // Apply resolved price when available — must be at top level of component
  useEffect(() => {
    if (resolvedPrice && selectedServiceId) {
      setValue(`items.${index}.unit_price`, resolvedPrice.price);
      setValue(`items.${index}.pricing_source`, resolvedPrice.source);
    }
  }, [resolvedPrice, selectedServiceId, index, setValue]);

  return (
    <Controller
      control={control}
      name={`items.${index}`}
      render={({ field, fieldState }) => {
        const item = field.value;
        const qty = item.quantity || 1;
        const unitPrice = item.unit_price || 0;
        const discount = item.discount_amount || 0;
        const lineTotal = qty * unitPrice - discount;

        function handleServiceSelect(svc: ServiceOption) {
          setSelectedServiceId(svc.id);
          setSearch(svc.name);
          setShowDropdown(false);
          field.onChange({
            ...item,
            service_id: svc.id,
            description: svc.name,
          });
        }

        return (
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            {/* Service / Description */}
            <div className="col-span-6 grid grid-cols-[1fr_1fr] gap-2">
              {!isCustom && (
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder={t("searchService")}
                    className={inputClass}
                  />
                  {showDropdown && serviceOptions.length > 0 && (
                    <ul className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {serviceOptions.map((svc) => (
                        <li key={svc.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                            onMouseDown={() => handleServiceSelect(svc)}
                          >
                            <span>{svc.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Description */}
              <input
                type="text"
                value={item.description}
                onChange={(e) => field.onChange({ ...item, description: e.target.value })}
                placeholder={t("descriptionPlaceholder")}
                className={cn(inputClass, !!fieldState.error && !item.description && "border-red-400")}
              />
            </div>

            {/* Qty */}
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) =>
                field.onChange({ ...item, quantity: parseInt(e.target.value, 10) || 1 })
              }
              className={cn(inputClass, "w-16 text-center")}
              placeholder={t("qtyPlaceholder")}
            />

            {/* Unit price + pricing source */}
            <div className="min-w-[120px]">
              {isPriceLoading && selectedServiceId ? (
                <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
              ) : (
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      field.onChange({ ...item, unit_price: parseFloat(e.target.value) || 0 })
                    }
                    readOnly={!!resolvedPrice && !isCustom}
                    className={cn(
                      inputClass,
                      !!resolvedPrice && !isCustom && "bg-gray-50 text-gray-500",
                    )}
                    placeholder={t("unitPricePlaceholder")}
                  />
                  {item.pricing_source ? (
                    <InvoicePricingSourceBadge
                      source={item.pricing_source}
                    />
                  ) : selectedServiceId && !isPriceLoading ? (
                    <span className="text-[11px] text-amber-600">{t("noPriceConfigured")}</span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Discount */}
            <input
              type="number"
              min={0}
              step="0.01"
              value={item.discount_amount ?? ""}
              onChange={(e) =>
                field.onChange({
                  ...item,
                  discount_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className={cn(inputClass, "w-24")}
              placeholder={t("discountPlaceholder")}
            />

            {/* Line total */}
            <div className="flex h-9 min-w-[100px] items-center justify-end rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700">
              {formatMoney(lineTotal, currency)}
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label={t("removeItemAria")}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      }}
    />
  );
}

const EMPTY_SERVICE_ROW = {
  service_id: "",
  description: "",
  quantity: 1,
  unit_price: 0,
  discount_amount: undefined,
  pricing_source: undefined,
};

const EMPTY_CUSTOM_ROW = {
  service_id: undefined,
  description: "",
  quantity: 1,
  unit_price: 0,
  discount_amount: undefined,
  pricing_source: undefined,
};

export function InvoiceLineItemsEditor({
  control,
  setValue,
  orgId,
  branchId,
  profileId,
  currency,
}: Props) {
  const t = useTranslations("financial.invoice.lineItems");
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Column headers */}
      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-2 px-3 text-xs font-medium text-gray-400">
          <span className="col-span-2">{t("header")}</span>
          <span className="w-16 text-center">{t("qty")}</span>
          <span className="min-w-[120px]">{t("unitPrice")}</span>
          <span className="w-24">{t("discount")}</span>
          <span className="min-w-[100px] text-right">{t("total")}</span>
          <span className="w-9" />
        </div>
      )}

      {fields.map((field, index) => (
        <LineItemRow
          key={field.id}
          index={index}
          control={control}
          setValue={setValue}
          orgId={orgId}
          branchId={branchId}
          profileId={profileId}
          currency={currency}
          onRemove={() => remove(index)}
          isCustom={!field.service_id}
        />
      ))}

      {fields.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          {t("noItems")}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...EMPTY_SERVICE_ROW })}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addService")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ ...EMPTY_CUSTOM_ROW })}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addCustomLine")}
        </Button>
      </div>
    </div>
  );
}
