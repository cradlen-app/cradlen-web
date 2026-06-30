import type { Metadata, Viewport } from "next";
import { Poppins, Cairo } from "next/font/google";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "Cradlen",
  description: "Cradlen",
  applicationName: "Cradlen",
  // Tells iOS to launch the home-screen icon in standalone (no Safari chrome),
  // matching the manifest `display: "standalone"` used by Android/desktop.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cradlen",
  },
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
