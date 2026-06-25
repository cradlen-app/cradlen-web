import type { ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import { Info, TriangleAlert, Lightbulb } from "lucide-react";
import { cn } from "@/common/utils/utils";

/**
 * Presentational building blocks made available to every guide MDX file via
 * `src/mdx-components.tsx`. They are server-safe (no hooks/state) so MDX can be
 * rendered inside Server Components.
 */

type CalloutType = "note" | "warn" | "tip";

const CALLOUT_STYLES: Record<
  CalloutType,
  { wrap: string; icon: typeof Info; iconClass: string }
> = {
  note: {
    wrap: "border-brand-primary/25 bg-brand-primary/5",
    icon: Info,
    iconClass: "text-brand-primary",
  },
  tip: {
    wrap: "border-brand-secondary/40 bg-brand-secondary/10",
    icon: Lightbulb,
    iconClass: "text-brand-secondary",
  },
  warn: {
    wrap: "border-amber-300 bg-amber-50",
    icon: TriangleAlert,
    iconClass: "text-amber-600",
  },
};

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const style = CALLOUT_STYLES[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "not-prose my-6 flex gap-3 rounded-2xl border p-4 text-sm leading-7 text-brand-black/80",
        style.wrap,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", style.iconClass)} aria-hidden />
      <div className="space-y-1">
        {title ? (
          <p className="font-semibold text-brand-black">{title}</p>
        ) : null}
        <div className="[&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="not-prose my-6 list-none space-y-4 ps-0 [counter-reset:step]">
      {children}
    </ol>
  );
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <li className="relative flex gap-4 [counter-increment:step]">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-primary text-sm font-semibold text-white before:content-[counter(step)]"
      />
      <div className="pt-1">
        <p className="font-semibold text-brand-black">{title}</p>
        {children ? (
          <div className="mt-1 text-sm leading-7 text-brand-black/75 [&>p]:m-0 [&>p+p]:mt-2">
            {children}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Screenshot frame. Pass a statically-imported image as `src` once real
 * captures exist (fictional mock data only — never real PII). Until then it
 * renders a labelled placeholder so the layout reflects where the shot goes.
 */
export function Figure({
  src,
  alt,
  caption,
}: {
  src?: ImageProps["src"];
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="not-prose my-8" dir="ltr">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        {src ? (
          <Image
            src={src}
            alt={alt}
            sizes="(max-width: 768px) 100vw, 720px"
            className="h-auto w-full"
            placeholder={typeof src === "object" ? "blur" : undefined}
          />
        ) : (
          <div className="grid aspect-[16/10] place-items-center bg-[#F4F3EC] text-center text-xs font-medium uppercase tracking-[0.16em] text-brand-black/35">
            {alt}
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs text-brand-black/55">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
