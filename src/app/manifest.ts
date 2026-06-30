import type { MetadataRoute } from "next";

// PWA manifest. Next.js serves this at `/manifest.webmanifest` and auto-injects
// the `<link rel="manifest">` tag, so no manual head wiring is needed.
//
// `start_url`/`scope` stay at the root: the locale prefix and the
// org/branch-scoped dashboard URL are resolved at runtime by `src/proxy.ts`
// (locale + auth redirect), so hard-coding either here would break installs for
// users in a different locale or tenant.
//
// Icons live in the root `public/` dir (served verbatim by Next) rather than
// `src/public/` (which is import-only). `theme_color` is brand-primary (#11604C).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cradlen",
    short_name: "Cradlen",
    description: "Cradlen — clinic operations and unified medical records.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#11604C",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
