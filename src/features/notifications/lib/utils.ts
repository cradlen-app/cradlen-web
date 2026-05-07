export function formatRelativeTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (minutes < 1) return new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(0, "second");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}
