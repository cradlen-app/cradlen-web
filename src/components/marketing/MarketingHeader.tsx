"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import TrackedLink from "@/components/analytics/TrackedLink";
import { Link } from "@/i18n/navigation";
import Logo from "@/public/Logo.png";

// The header now renders on /pricing, /about and /contact too, so the section
// anchors are rooted at "/" rather than bare "#features" — a bare hash resolves
// against the *current* page and would go nowhere off the landing page.
const NAV_LINKS = [
  { key: "features", href: "/#features" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "pricing", href: "/pricing" },
  { key: "about", href: "/about" },
  { key: "docs", href: "/guide" },
] as const;

export default function MarketingHeader() {
  const t = useTranslations("home.header");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F4F3EC]/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link
          href="/"
          aria-label="Cradlen home"
          className="inline-flex w-28 shrink-0"
        >
          <Image src={Logo} alt="CRADLEN" priority className="h-auto w-full" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-brand-black/70 transition-colors hover:text-brand-primary"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-brand-black/80 transition-colors hover:text-brand-primary"
          >
            {t("signIn")}
          </Link>
          <Button
            asChild
            className="h-10 rounded-full bg-brand-primary px-6 text-sm text-white hover:bg-brand-primary/90"
          >
            <TrackedLink
              href="/sign-up"
              event="cta_start_free"
              eventProps={{ location: "header" }}
            >
              {t("startFree")}
            </TrackedLink>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-full text-brand-black transition-colors hover:bg-black/5 lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-black/5 transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <div className="flex flex-col gap-1 px-5 py-4 sm:px-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-black/80 transition-colors hover:bg-black/5"
            >
              {t(link.key)}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-4">
            <Button
              asChild
              variant="outline"
              className="h-10 flex-1 rounded-full border-brand-primary/30 text-sm text-brand-primary"
            >
              <Link href="/sign-in" onClick={() => setOpen(false)}>
                {t("signIn")}
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 flex-1 rounded-full bg-brand-primary px-6 text-sm text-white hover:bg-brand-primary/90"
            >
              <TrackedLink
                href="/sign-up"
                event="cta_start_free"
                eventProps={{ location: "header_mobile" }}
                onClick={() => setOpen(false)}
              >
                {t("startFree")}
              </TrackedLink>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
