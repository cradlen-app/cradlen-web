"use client";

import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAddPriceListItem } from "../../hooks/useAddPriceListItem";
import { useUpdatePriceListItem } from "../../hooks/useUpdatePriceListItem";
import { useRemovePriceListItem } from "../../hooks/useRemovePriceListItem";
import { useBulkSetPriceListItems } from "../../hooks/usePriceListActions";
import { fetchServices } from "../../lib/services.api";
import { formatMoney } from "../../lib/format";
import type { PriceListItem } from "../../types/financial.types";

// Bulk-adjust dialog, service typeahead, and the inline price-edit / add rows
// for a single price list — extracted from PriceListCard so the card stays a
// thin orchestrator.

// ── Bulk percentage-adjustment dialog ────────────────────────────────────────

export function BulkAdjustDialog({
  open,
  onOpenChange,
  priceListId,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceListId: string;
  items: PriceListItem[];
}) {
  const t = useTranslations("financial.priceLists.bulk");
  const tCommon = useTranslations("financial.common");
  const [percent, setPercent] = useState("");
  const bulk = useBulkSetPriceListItems(priceListId);

  function apply() {
    const pct = Number(percent) || 0;
    const factor = 1 + pct / 100;
    const next = items.map((it) => ({
      service_id: it.service_id,
      unit_price: Math.round(it.unit_price * factor * 100) / 100,
    }));
    bulk.mutate({ items: next }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {t("title")}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-gray-400">
            {t("description")}
          </Dialog.Description>
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">{t("noItems")}</p>
          ) : (
            <>
              <label className="mt-4 mb-1.5 block text-xs font-medium text-gray-700">
                {t("percentLabel")}{" "}
                <span className="text-gray-400">{t("percentHint")}</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={apply}
              disabled={items.length === 0 || percent === "" || bulk.isPending}
            >
              {bulk.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("applying")}
                </>
              ) : (
                t("apply")
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Service combobox for adding items ────────────────────────────────────────

type ServiceOption = { id: string; name: string; code: string };

function ServiceCombobox({
  orgId,
  onSelect,
}: {
  orgId: string;
  onSelect: (svc: ServiceOption) => void;
}) {
  const t = useTranslations("financial.priceLists.items");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce 300ms — matches InvoiceLineItemsEditor pattern
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const active = { cancelled: false };
    if (!debouncedSearch) {
      Promise.resolve().then(() => {
        if (!active.cancelled) setOptions([]);
      });
      return () => { active.cancelled = true; };
    }
    // Backend has no `search` query param — fetch active services and
    // filter client-side.
    const needle = debouncedSearch.toLowerCase();
    fetchServices(orgId, { active: true, limit: 100 })
      .then((res) => {
        if (!active.cancelled)
          setOptions(
            res.data
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(needle) ||
                  s.code.toLowerCase().includes(needle),
              )
              .map((s) => ({ id: s.id, name: s.name, code: s.code })),
          );
      })
      .catch(() => { if (!active.cancelled) setOptions([]); });
    return () => { active.cancelled = true; };
  }, [debouncedSearch, orgId]);

  function handleSelect(svc: ServiceOption) {
    setSearch(svc.name);
    setShowDropdown(false);
    onSelect(svc);
  }

  return (
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
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
      />
      {showDropdown && options.length > 0 && (
        <ul className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.map((svc) => (
            <li key={svc.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                onMouseDown={() => handleSelect(svc)}
              >
                <span>{svc.name}</span>
                <span className="ml-2 font-mono text-xs text-gray-400">
                  {svc.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Inline editable price row ─────────────────────────────────────────────────

export function PriceListItemRow({
  item,
  priceListId,
  currency,
}: {
  item: PriceListItem;
  priceListId: string;
  currency?: string | null;
}) {
  const t = useTranslations("financial.priceLists.items");
  const tCommon = useTranslations("financial.common");
  const [editPrice, setEditPrice] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdatePriceListItem(priceListId);
  const removeMutation = useRemovePriceListItem(priceListId);

  function startEdit() {
    setEditPrice(item.unit_price);
    setIsEditing(true);
  }

  function handleSave() {
    if (editPrice === null) return;
    updateMutation.mutate(
      { itemId: item.id, payload: { unit_price: editPrice } },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  function handleCancel() {
    setEditPrice(null);
    setIsEditing(false);
  }

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
      <td className="px-4 py-2.5 text-sm text-gray-900">
        {item.service?.name ?? item.service_id}
      </td>
      <td className="px-4 py-2.5">
        {isEditing ? (
          <input
            type="number"
            min={0}
            step="0.01"
            value={editPrice ?? ""}
            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
            autoFocus
            className="w-28 rounded-lg border border-blue-400 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500/20"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            title="Click to edit"
            className="rounded px-1 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          >
            {formatMoney(item.unit_price, currency)}
          </button>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-3.5" aria-hidden="true" />
                )}
                {tCommon("save")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                {tCommon("cancel")}
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => removeMutation.mutate(item.id)}
              disabled={removeMutation.isPending}
              aria-label={t("removeItemAria")}
              className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              {removeMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Add item row ──────────────────────────────────────────────────────────────

export function AddItemRow({
  orgId,
  priceListId,
}: {
  orgId: string;
  priceListId: string;
}) {
  const t = useTranslations("financial.priceLists.items");
  const [selectedService, setSelectedService] =
    useState<ServiceOption | null>(null);
  const [price, setPrice] = useState("");
  const addMutation = useAddPriceListItem(priceListId);

  function handleAdd() {
    if (!selectedService || !price) return;
    addMutation.mutate(
      { service_id: selectedService.id, unit_price: parseFloat(price) },
      {
        onSuccess: () => {
          setSelectedService(null);
          setPrice("");
        },
      },
    );
  }

  return (
    <tr className="border-t-2 border-dashed border-gray-100 bg-gray-50/30">
      <td className="px-4 py-2.5">
        <ServiceCombobox orgId={orgId} onSelect={setSelectedService} />
      </td>
      <td className="px-4 py-2.5">
        <input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t("pricePlaceholder")}
          className="w-28 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
        />
      </td>
      <td className="px-4 py-2.5 text-right">
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!selectedService || !price || addMutation.isPending}
        >
          {addMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-3.5" aria-hidden="true" />
          )}
          {t("add")}
        </Button>
      </td>
    </tr>
  );
}
