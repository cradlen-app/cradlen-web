import type { Metadata, Viewport } from "next";
import { Poppins, Cairo } from "next/font/google";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/common/constants/site";
import "@/styles/globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // `default` only shows on routes that set no title of their own. Every public
  // page sets one via `buildMetadata`, which feeds this template — pages whose
  // title already ends in "| Cradlen" pass `{ absolute }` to opt out.
  //
  // Deliberately no `alternates` here: a layout-level canonical is inherited by
  // every child page that doesn't override it, which would canonicalize e.g.
  // /en/guide/visits to /en. Canonical is page-only (see common/seo/metadata).
  title: {
    default: "Clinic Management Software & EMR for OB-GYN Clinics | Cradlen",
    template: "%s | Cradlen",
  },
  description:
    "Cradlen is OB-GYN clinic management and EMR software — appointments, antenatal journeys, examinations, prescriptions and billing in one unified patient record.",
  applicationName: "Cradlen",
  // Tells iOS to launch the home-screen icon in standalone (no Safari chrome),
  // matching the manifest `display: "standalone"` used by Android/desktop.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cradlen",
  },
  // Fallback only. Prefer verifying Search Console with a DNS TXT record and a
  // *Domain* property: the meta-tag method verifies a URL-prefix property, and
  // `/` 307-redirects to `/en` (next-intl, localePrefix "always") — verifying
  // through a redirect is exactly the case that fails intermittently. A Domain
  // property also covers apex + www + both locales in one go.
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? {
        verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION },
      }
    : {}),
};

// `themeColor` colors the browser/OS UI around the installed app; it must be a
// `viewport` export (not `metadata`) in Next.js App Router.
export const viewport: Viewport = {
  themeColor: "#11604C",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${poppins.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <div id="app-shell" className="contents">
          {children}
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
