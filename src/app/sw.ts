import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DEFAULT_URL = "/pacient/medicamentos";
const DEFAULT_TITLE = "Hora do medicamento";
const DEFAULT_BODY = "Abra o MedGuide para ver seus lembretes.";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
});

serwist.addEventListeners();

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
  medicationId?: string;
};

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};

  try {
    if (event.data) {
      payload = event.data.json() as PushPayload;
    }
  } catch {
    try {
      const text = event.data?.text();
      if (text) {
        payload = { body: text };
      }
    } catch {
      payload = {};
    }
  }

  const title = payload.title?.trim() || DEFAULT_TITLE;
  const body = payload.body?.trim() || DEFAULT_BODY;
  const url = payload.url?.trim() || DEFAULT_URL;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url, medicationId: payload.medicationId },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || DEFAULT_URL;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await (client as WindowClient).navigate(targetUrl);
          }
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
