"use client";

import { useState, useEffect } from "react";
import { AlertDialog } from "radix-ui";
import { ChevronDown, ChevronUp, Trash2, Pencil, Plus, Save, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { usePriceListItems } from "../../hooks/usePriceListItems";
import { useAddPriceListItem } from "../../hooks/useAddPriceListItem";
import { useUpdatePriceListItem } from "../../hooks/useUpdatePriceListItem";
import { useRemovePriceListItem } from "../../hooks/useRemovePriceListItem";
import { useDeletePriceList } from "../../hooks/useDeletePriceList";
import { fetchServices } from "../../lib/services.api";
import { formatMoney } from "../../lib/format";
import type { PriceList, PriceListItem } from "../../types/financial.types";
import { PriceListDrawer } from "./PriceListDrawer";

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

function PriceListItemRow({
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

function AddItemRow({
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

// ── PriceListCard ─────────────────────────────────────────────────────────────

type Props = {
  priceList: PriceList;
};

export function PriceListCard({ priceList }: Props) {
  const t = useTranslations("financial.priceLists");
  const tItems = useTranslations("financial.priceLists.items");
  const tCommon = useTranslations("financial.common");
  const orgId = useAuthContextStore((s) => s.organizationId) ?? "";
  const [expanded, setExpanded] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { items, isLoading: itemsLoading } = usePriceListItems(
    expanded ? priceList.id : null,
  );
  const deleteMutation = useDeletePriceList();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm shadow-gray-100/50">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Scope badge */}
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            priceList.branch_id
              ? "bg-blue-50 text-blue-700"
              : "bg-gray-100 text-gray-600",
          )}
        >
          {priceList.branch_id ? t("scope.branch") : t("scope.org")}
        </span>

        {/* Default badge */}
        {priceList.is_default && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {t("default")}
          </span>
        )}

        {/* Active badge */}
        {!priceList.is_active && (
          <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
            {t("inactive")}
          </span>
        )}

        {/* Name */}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          {priceList.name}
        </span>

        {/* Actions */}
        <button
          type="button"
          onClick={() => setEditDrawerOpen(true)}
          aria-label={t("editAria")}
          className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleteMutation.isPending}
          aria-label={t("deleteAria")}
          className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3.5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? t("collapseAria") : t("expandAria")}
          className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          {expanded ? (
            <ChevronUp className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-gray-100">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              {tItems("loading")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                    <th className="px-4 py-2 text-left font-medium">{tItems("service")}</th>
                    <th className="px-4 py-2 text-left font-medium">
                      {tItems("unitPrice")}
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-center text-sm text-gray-400"
                      >
                        {tItems("noItems")}
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <PriceListItemRow
                        key={item.id}
                        item={item}
                        priceListId={priceList.id}
                        currency={priceList.currency}
                      />
                    ))
                  )}
                  <AddItemRow orgId={orgId} priceListId={priceList.id} />
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit drawer */}
      <PriceListDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        mode="edit"
        priceList={priceList}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-gray-900">
              {t("deleteConfirm.title")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {t("deleteConfirm.description")}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
                  {tCommon("cancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteMutation.mutate(priceList.id, {
                      onSuccess: () => setDeleteDialogOpen(false),
                    });
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      {tCommon("deleting")}
                    </>
                  ) : (
                    t("deleteConfirm.confirm")
                  )}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
