/// <reference lib="webworker" />
//
// Serwist service worker for Cradlen. Compiled by `@serwist/next` (see
// next.config.ts), output to `public/sw.js`, and auto-registered on the client.
//
// Excluded from the app's main tsconfig (it needs the WebWorker lib, which would
// clash with the DOM lib project-wide). Type-checked in isolation via
// tsconfig.sw.json.
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Injected at build time by @serwist/next — the precache manifest.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// PHI guardrail. Every same-origin /api/* request — the authenticated backend
// proxy at /api/backend, the /api/auth/* token routes, /api/version — is served
// NetworkOnly so no patient data, auth payload, or session state is ever written
// to Cache Storage. This MUST precede `defaultCache`, whose own same-origin
// /api/ rule is NetworkFirst (which *would* cache responses). First match wins.
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Activate a new worker immediately and take control of open tabs. The
  // existing version banner (UpdateBanner) already prompts staff to reload, so
  // pairing it with skipWaiting means a refresh always lands on the new shell.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        // Shown when a document navigation fails offline. `/offline.html` is a
        // static file in public/ (not a Next route), so it is always precached
        // and renders with no JS/CSS dependencies even when the shell is gone.
        url: "/offline.html",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// --- Web push (Layer 3) -----------------------------------------------------
// Payload shape is produced by the backend PushService.sendToProfile(...).
type PushPayload = {
  title?: string;
  body?: string;
  navigate_to?: string | null;
  tag?: string;
};

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: "Cradlen", body: event.data.text() };
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title || "Cradlen", {
        body: payload.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: payload.tag,
        data: { navigate_to: payload.navigate_to ?? null },
      });

      // Keep an open tab's in-app feed/badge fresh without a poll.
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({ type: "cradlen:notification" });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data?.navigate_to as string | null | undefined) || "/";
  // Resolve against the worker scope so it can be compared to open tab URLs.
  const targetUrl = new URL(target, self.registration.scope);

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // If a tab is already on the deep link, just focus it — never navigate a
      // tab the user may be mid-task in (e.g. an in-progress visit), which would
      // discard unsaved work.
      for (const client of clients) {
        if (new URL(client.url).pathname === targetUrl.pathname) {
          await client.focus();
          return;
        }
      }

      // Otherwise open the deep link in a new tab, leaving existing tabs intact.
      await self.clients.openWindow(targetUrl.href);
    })(),
  );
});
