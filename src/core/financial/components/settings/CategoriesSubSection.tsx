"use client";

import { useState } from "react";
import { AlertDialog } from "radix-ui";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { useCategories, useDeleteCategory } from "../../hooks/useCategories";
import type { ServiceCategory } from "../../types/financial.types";
import { CategoryDrawer } from "./CategoryDrawer";

function DeleteCategoryDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("financial.categories");
  const tCommon = useTranslations("financial.common");
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
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
              <Button type="button" variant="outline" disabled={isPending}>
                {tCommon("cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={isPending}
              >
                {isPending ? (
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
  );
}

export function CategoriesSubSection() {
  const t = useTranslations("financial.categories");
  const { categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<ServiceCategory | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ServiceCategory | null>(null);

  function openCreate() {
    setSelected(undefined);
    setDrawerMode("create");
    setDrawerOpen(true);
  }

  function openEdit(category: ServiceCategory) {
    setSelected(category);
    setDrawerMode("edit");
    setDrawerOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">{t("title")}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{t("description")}</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("newCategory")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            {t("loading")}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">{t("empty")}</p>
            <p className="mt-1 text-sm text-gray-400">{t("emptyHint")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-2.5 text-start font-medium">
                  {t("fields.code")}
                </th>
                <th className="px-4 py-2.5 text-start font-medium">
                  {t("fields.name")}
                </th>
                <th className="px-4 py-2.5 text-start font-medium">
                  {t("fields.description")}
                </th>
                <th className="px-4 py-2.5 text-end font-medium" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className={cn(
                    "border-b border-gray-50 last:border-0 hover:bg-gray-50/50",
                    !category.is_active && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {category.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {category.name}
                    {!category.is_active && (
                      <span className="ms-2 text-xs text-gray-400">
                        {t("inactive")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {category.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        aria-label={t("editAria")}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(category)}
                        aria-label={t("deleteAria")}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CategoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        category={selected}
      />

      <DeleteCategoryDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
