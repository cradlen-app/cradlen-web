"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import type { EventProps } from "@/infrastructure/analytics/events";
import { capture } from "@/infrastructure/analytics/posthog";

/**
 * A locale-aware `Link` that reports a marketing CTA click.
 *
 * This exists so the marketing sections (Hero, Pricing, FinalCta) can stay
 * *server* components: only the anchor crosses into the client, and its children
 * — already-translated strings, icon elements — are passed in as props from the
 * server. Marking those sections `"use client"` instead would force
 * `getTranslations` → `useTranslations` and pull all the landing copy into the
 * browser bundle.
 *
 * `capture()` is a no-op until analytics is configured AND the visitor has
 * consented, so this is safe to render for anonymous traffic.
 */
type TrackedEvent =
  | { event: "cta_start_free"; eventProps: EventProps["cta_start_free"] }
  | { event: "cta_choose_plan"; eventProps: EventProps["cta_choose_plan"] }
  | { event: "cta_contact"; eventProps: EventProps["cta_contact"] };

type Props = ComponentProps<typeof Link> & TrackedEvent;

export default function TrackedLink({
  event,
  eventProps,
  onClick,
  ...linkProps
}: Props) {
  // Switching on the discriminant narrows `eventProps` to the right shape for
  // each event, so `capture` stays fully typed — no cast.
  const track: NonNullable<Props["onClick"]> = (e) => {
    switch (event) {
      case "cta_start_free":
        capture(event, eventProps);
        break;
      case "cta_choose_plan":
        capture(event, eventProps);
        break;
      case "cta_contact":
        capture(event, eventProps);
        break;
    }
    // Compose rather than replace: callers pass their own onClick (the mobile
    // nav closes its menu with one), and swallowing it here would break them.
    onClick?.(e);
  };

  return <Link {...linkProps} onClick={track} />;
}
