"use client";

import { ChevronDown } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";

export interface GuideNavItem {
  href: string;
  label: string;
}

export interface GuideNavSection {
  id: string;
  title: string;
  items: GuideNavItem[];
}

export interface GuideSidebarProps {
  overview: GuideNavItem;
  sections: GuideNavSection[];
  whatsNew: GuideNavItem;
  /** Accessible label for the mobile disclosure (e.g. "User Guide"). */
  menuLabel: string;
}

function NavLinks({
  overview,
  sections,
  whatsNew,
  activePath,
  onNavigate,
}: GuideSidebarProps & { activePath: string; onNavigate?: () => void }) {
  const linkClass = (href: string) =>
    cn(
      "block rounded-lg px-3 py-2 text-sm transition-colors",
      activePath === href
        ? "bg-brand-primary/10 font-medium text-brand-primary"
        : "text-brand-black/65 hover:bg-black/5 hover:text-brand-black",
    );

  return (
    <nav className="space-y-6">
      <Link href={overview.href} onClick={onNavigate} className={linkClass(overview.href)}>
        {overview.label}
      </Link>

      {sections.map((section) => (
        <div key={section.id}>
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-black/40">
            {section.title}
          </p>
          <ul className="mt-2 space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Link href={whatsNew.href} onClick={onNavigate} className={linkClass(whatsNew.href)}>
        {whatsNew.label}
      </Link>
    </nav>
  );
}

export default function GuideSidebar(props: GuideSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: collapsible disclosure above the article. */}
      <details className="group mb-6 rounded-2xl border border-black/10 bg-white/60 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-brand-black">
          {props.menuLabel}
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-black/10 px-2 py-3">
          <NavLinks {...props} activePath={pathname} />
        </div>
      </details>

      {/* Desktop: sticky rail. */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <NavLinks {...props} activePath={pathname} />
        </div>
      </aside>
    </>
  );
}
