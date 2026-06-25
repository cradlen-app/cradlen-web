"use client";

import { useEffect, useState } from "react";
import { cn } from "@/common/utils/utils";

interface Heading {
  id: string;
  text: string;
}

/**
 * "On this page" rail. Reads the `h2` headings rendered inside `#guide-article`
 * (ids are added by the `rehype-slug` MDX plugin) and tracks the one in view.
 * Client-only — it inspects the DOM after the server-rendered article mounts.
 */
export default function ArticleToc({ label }: { label: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const article = document.getElementById("guide-article");
    if (!article) return;

    const nodes = Array.from(article.querySelectorAll("h2")).filter(
      (node) => node.id,
    );
    if (nodes.length === 0) return;

    // Publish the collected headings on the next frame so the state update
    // isn't synchronous within the effect body (avoids cascading renders).
    const raf = requestAnimationFrame(() =>
      setHeadings(nodes.map((node) => ({ id: node.id, text: node.textContent ?? "" }))),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav aria-label={label} className="text-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-black/40">
        {label}
      </p>
      <ul className="mt-3 space-y-2 border-s border-black/10 ps-4">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block transition-colors hover:text-brand-primary",
                activeId === heading.id
                  ? "font-medium text-brand-primary"
                  : "text-brand-black/55",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
