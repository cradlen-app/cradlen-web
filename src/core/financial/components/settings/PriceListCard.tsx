"use client";

import { useState } from "react";
import { AlertDialog } from "radix-ui";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Loader2,
  Star,
  Power,
  Percent,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { usePriceListItems } from "../../hooks/usePriceListItems";
import { useDeletePriceList } from "../../hooks/useDeletePriceList";
import {
  useSetDefaultPriceList,
  useTogglePriceListActive,
} from "../../hooks/usePriceListActions";
import type { PriceList } from "../../types/financial.types";
import { PriceListDrawer } from "./PriceListDrawer";
import {
  AddItemRow,
  BulkAdjustDialog,
  PriceListItemRow,
} from "./price-list-item-editors";

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const { items, isLoading: itemsLoading } = usePriceListItems(
    expanded ? priceList.id : null,
  );
  const deleteMutation = useDeletePriceList();
  const setDefault = useSetDefaultPriceList();
  const toggleActive = useTogglePriceListActive();

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
        {!priceList.is_default && (
          <button
            type="button"
            onClick={() => setDefault.mutate(priceList.id)}
            disabled={setDefault.isPending}
            title={t("setDefault")}
            aria-label={t("setDefault")}
            className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
          >
            <Star className="size-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            toggleActive.mutate({
              id: priceList.id,
              active: !priceList.is_active,
            })
          }
          disabled={toggleActive.isPending}
          title={priceList.is_active ? t("deactivate") : t("activate")}
          aria-label={priceList.is_active ? t("deactivate") : t("activate")}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
            priceList.is_active
              ? "text-emerald-500 hover:bg-emerald-50"
              : "text-gray-300 hover:bg-gray-100 hover:text-gray-500",
          )}
        >
          <Power className="size-3.5" aria-hidden="true" />
        </button>
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
          <div className="flex justify-end px-4 pt-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setBulkOpen(true)}
              disabled={itemsLoading || items.length === 0}
            >
              <Percent className="size-3.5" aria-hidden="true" />
              {t("bulkEdit")}
            </Button>
          </div>
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

      <BulkAdjustDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        priceListId={priceList.id}
        items={items}
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
