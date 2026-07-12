import { ImageResponse } from "next/og";

// Lives at the ROOT app segment, not under [locale], so it needs no locale
// param and is inherited by every route below it. A page can override it later
// by dropping its own `opengraph-image` in its segment.
//
// IMPORTANT: the emitted URL is `/opengraph-image?<hash>` — no file extension.
// `src/proxy.ts` must exclude it from the auth gate, or social crawlers get a
// 307 to /sign-in and every shared link renders as a bare card.
export const alt = "Cradlen — clinic management software for OB-GYN clinics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens (globals.css). Duplicated as literals because Satori resolves no
// CSS variables and no Tailwind.
const BRAND_PRIMARY = "#11604C";
const BRAND_SECONDARY = "#AAB37D";
const CANVAS = "#F4F3EC";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BRAND_PRIMARY,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: BRAND_SECONDARY,
            }}
          />
          <div
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: CANVAS,
              letterSpacing: -0.5,
            }}
          >
            Cradlen
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              color: CANVAS,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            Care is a journey, not a list of visits.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: BRAND_SECONDARY,
              maxWidth: 900,
            }}
          >
            Clinic management &amp; EMR software for OB-GYN and women&apos;s
            health clinics.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
