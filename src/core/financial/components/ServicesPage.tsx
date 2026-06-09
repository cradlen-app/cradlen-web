"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";

import { FinancialPageShell } from "./FinancialPageShell";
import { ServicesSubSection } from "./settings/ServicesSubSection";
import { CategoriesSubSection } from "./settings/CategoriesSubSection";
import { PriceListsSubSection } from "./settings/PriceListsSubSection";
import { ProviderPricingSubSection } from "./settings/ProviderPricingSubSection";
import { AuthorizationsSubSection } from "./settings/AuthorizationsSubSection";

type Tab =
  | "services"
  | "categories"
  | "priceLists"
  | "providerPricing"
  | "authorizations";

const TABS: Tab[] = [
  "categories",
  "services",
  "priceLists",
  "authorizations",
  "providerPricing",
];

/**
 * Services & Pricing page — the canonical home for the service catalog,
 * categories, price lists, and provider pricing. Composes the migrated
 * subsections under one tabbed surface.
 */
export function ServicesPage() {
  const t = useTranslations("financial");
  const [tab, setTab] = useState<Tab>("services");

  return (
    <FinancialPageShell
      title={t("servicesPage.title")}
      subtitle={t("servicesPage.subtitle")}
    >
      <div className="flex flex-col gap-5">
        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 border-b border-gray-100">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                tab === key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-400 hover:text-brand-black",
              )}
            >
              {t(`servicesPage.tabs.${key}`)}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === "services" && <ServicesSubSection />}
        {tab === "categories" && <CategoriesSubSection />}
        {tab === "priceLists" && <PriceListsSubSection />}
        {tab === "providerPricing" && <ProviderPricingSubSection />}
        {tab === "authorizations" && <AuthorizationsSubSection />}
      </div>
    </FinancialPageShell>
  );
}
