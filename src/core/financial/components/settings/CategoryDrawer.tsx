"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useCreateCategory, useUpdateCategory } from "../../hooks/useCategories";
import type { ServiceCategory } from "../../types/financial.types";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/**
 * Auto-generates a unique category code from the name (mirrors the service
 * drawer): slugifies to uppercase alphanumerics and appends a short random
 * suffix so same-named categories don't collide on the backend's unique code.
 */
function generateCategoryCode(name: string): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return slug ? `${slug}-${suffix}` : `CAT-${suffix}`;
}

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  category?: ServiceCategory;
};

export function CategoryDrawer({ open, onOpenChange, mode, category }: Props) {
  const t = useTranslations("financial.categories");
  const tCommon = useTranslations("financial.common");
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open && mode === "edit" && category) {
      form.reset({
        name: category.name,
        description: category.description ?? "",
      });
    } else if (open && mode === "create") {
      form.reset({ name: "", description: "" });
    }
  }, [open, mode, category, form]);

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = form.handleSubmit((data) => {
    if (mode === "create") {
      createMutation.mutate(
        {
          code: generateCategoryCode(data.name),
          name: data.name,
          description: data.description || undefined,
        },
        { onSuccess: handleClose },
      );
    } else if (category) {
      updateMutation.mutate(
        {
          id: category.id,
          payload: {
            name: data.name,
            description: data.description || undefined,
          },
        },
        { onSuccess: handleClose },
      );
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-51 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {mode === "create" ? t("newCategory") : t("editCategory")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {t("description")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-900"
              onClick={handleClose}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Code — auto-generated; shown read-only when editing */}
              {mode === "edit" && category && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("fields.code")}
                  </label>
                  <input
                    type="text"
                    value={category.code}
                    readOnly
                    className={cn(inputClass, "bg-gray-50 text-gray-500")}
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("name")}
                  type="text"
                  placeholder={t("fields.namePlaceholder")}
                  className={cn(
                    inputClass,
                    form.formState.errors.name && "border-red-400",
                  )}
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.description")}{" "}
                  <span className="text-gray-400">{tCommon("optional")}</span>
                </label>
                <textarea
                  {...form.register("description")}
                  rows={3}
                  placeholder={t("fields.descriptionPlaceholder")}
                  className={cn(inputClass, "resize-none")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {tCommon("saving")}
                  </>
                ) : mode === "create" ? (
                  t("createCategory")
                ) : (
                  tCommon("saveChanges")
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
