"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePriceLists } from "../../hooks/usePriceLists";
import { PriceListCard } from "./PriceListCard";
import { PriceListDrawer } from "./PriceListDrawer";

export function PriceListsSubSection() {
  const t = useTranslations("financial.priceLists");
  const { priceLists, isLoading } = usePriceLists();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">{t("title")}</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {t("description")}
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setDrawerOpen(true)}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("newList")}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          {t("loadingPriceLists")}
        </div>
      ) : priceLists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm font-medium text-gray-700">{t("noPriceListsYet")}</p>
          <p className="mt-1 text-sm text-gray-400">
            {t("clickNewPriceList")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {priceLists.map((pl) => (
            <PriceListCard key={pl.id} priceList={pl} />
          ))}
        </div>
      )}

      {/* Create drawer */}
      <PriceListDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode="create"
      />
    </div>
  );
}
