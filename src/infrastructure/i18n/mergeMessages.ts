import type { Locale } from "@/common/kernel-contracts";
import type { ModuleRegistry } from "@/kernel";

/**
 * Combines the global base messages with each registered module's namespace
 * slice. Modules author **unwrapped** keys; the I18nRegistry wraps them under
 * `manifest.i18nNamespace` before returning here.
 *
 * Runs on both the server (inside `getRequestConfig`) and the client
 * (inside `NextIntlClientProvider`) using identical inputs so SSR + hydration
 * see the same tree — no mismatch warnings.
 *
 * If a module's namespace key already exists in the base messages, the
 * module slice **replaces** it. Phase C extracted any overlapping keys
 * (`messages/*.json` no longer contains a top-level `staff` object), so
 * collisions in practice are bugs and should surface during review.
 */
export async function mergeMessages(
  locale: Locale,
  base: Record<string, unknown>,
  registry: ModuleRegistry,
): Promise<Record<string, unknown>> {
  const slices = await registry.i18n.loadAll(locale);
  return { ...base, ...slices };
}
