"use client";

import { useState } from "react";
import { cn } from "@/common/utils/utils";
import {
  canManageBillingAdmin,
  canManageOwnPrices,
} from "@/features/auth/lib/permissions";
import type { UserProfile } from "@/common/types/user.types";
import { ServicesSubSection } from "./ServicesSubSection";
import { PriceListsSubSection } from "./PriceListsSubSection";
import { MyPricesSubSection } from "./MyPricesSubSection";

type SubSection = "services" | "price-lists" | "my-prices";

type Props = {
  profile: UserProfile | undefined;
};

function getInitialSub(profile: UserProfile | undefined): SubSection {
  if (canManageBillingAdmin(profile)) return "services";
  if (canManageOwnPrices(profile)) return "my-prices";
  return "services";
}

export function BillingSection({ profile }: Props) {
  const [activeSub, setActiveSub] = useState<SubSection>(
    getInitialSub(profile),
  );

  const showAdmin = canManageBillingAdmin(profile);
  const showMyPrices = canManageOwnPrices(profile);

  const navItems: { key: SubSection; label: string }[] = [
    ...(showAdmin
      ? ([
          { key: "services", label: "Services" },
          { key: "price-lists", label: "Price Lists" },
        ] as const)
      : []),
    ...(showMyPrices
      ? ([{ key: "my-prices", label: "My Prices" }] as const)
      : []),
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-100/60">
      {/* Section header */}
      <div className="mb-4 flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/8 text-brand-primary">
          {/* Receipt icon inline to avoid an import cycle with lucide */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 2 3 6 3 20 21 20 21 6 18 2 6 2" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="12" y1="6" x2="12" y2="2" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-medium text-brand-black">Billing</h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage services, pricing, and your personal rate overrides.
          </p>
        </div>
      </div>

      {/* Body: mini-nav + content */}
      <div className="flex min-h-0 gap-4">
        {/* Mini-nav */}
        <nav
          aria-label="Billing sub-sections"
          className="w-44 shrink-0 rounded-xl border border-gray-100 bg-gray-50/40 p-2"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSub(item.key)}
                className={cn(
                  "flex h-9 w-full items-center rounded-lg px-3 text-start text-sm font-medium transition",
                  activeSub === item.key
                    ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                    : "text-gray-400 hover:bg-gray-100 hover:text-brand-black",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content pane */}
        <div className="min-w-0 flex-1">
          {activeSub === "services" && showAdmin && <ServicesSubSection />}
          {activeSub === "price-lists" && showAdmin && <PriceListsSubSection />}
          {activeSub === "my-prices" && showMyPrices && <MyPricesSubSection />}
        </div>
      </div>
    </section>
  );
}
