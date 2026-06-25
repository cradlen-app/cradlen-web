"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import Logo from "@/public/Logo.png";

const NAV_LINKS = [
  { key: "features", href: "#features" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "pricing", href: "#pricing" },
  { key: "docs", href: "/guide", internal: true },
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
          {NAV_LINKS.map((link) =>
            "internal" in link && link.internal ? (
              <Link
                key={link.key}
                href={link.href}
                className="text-sm font-medium text-brand-black/70 transition-colors hover:text-brand-primary"
              >
                {t(link.key)}
              </Link>
            ) : (
              <a
                key={link.key}
                href={link.href}
                className="text-sm font-medium text-brand-black/70 transition-colors hover:text-brand-primary"
              >
                {t(link.key)}
              </a>
            ),
          )}
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
            <Link href="/sign-up">{t("startFree")}</Link>
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
          {NAV_LINKS.map((link) =>
            "internal" in link && link.internal ? (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-black/80 transition-colors hover:bg-black/5"
              >
                {t(link.key)}
              </Link>
            ) : (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-black/80 transition-colors hover:bg-black/5"
              >
                {t(link.key)}
              </a>
            ),
          )}
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
              <Link href="/sign-up" onClick={() => setOpen(false)}>
                {t("startFree")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
