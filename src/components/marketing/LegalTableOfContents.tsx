"use client";

import { useEffect, useState } from "react";
import { cn } from "@/common/utils/utils";

type TocItem = { id: string; label: string };

type Props = {
  items: TocItem[];
  label: string;
};

/**
 * Sticky table of contents for legal documents (Terms, Privacy). Anchors jump to
 * each section (smooth-scroll is global) and the active section is highlighted as
 * the reader scrolls via an IntersectionObserver. Desktop only.
 */
export default function LegalTableOfContents({ items, label }: Props) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="hidden lg:block">
      <div className="lg:sticky lg:top-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-black/45">
          {label}
        </p>
        <ul className="mt-4 space-y-2 border-s border-black/10 ps-4">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "block text-sm leading-6 text-brand-black/60 transition-colors hover:text-brand-primary",
                  activeId === item.id && "font-medium text-brand-primary",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
