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
  scheduledFor?: string;
  actions?: boolean;
};

function buildMedicamentosUrl(payload: PushPayload, confirm?: string): string {
  if (payload.url?.trim()) {
    return payload.url.trim();
  }

  const params = new URLSearchParams();
  if (confirm) params.set("confirm", confirm);
  if (payload.medicationId) params.set("medicationId", payload.medicationId);
  if (payload.scheduledFor) params.set("scheduledFor", payload.scheduledFor);
  const qs = params.toString();
  return qs ? `${DEFAULT_URL}?${qs}` : DEFAULT_URL;
}

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
  const url = buildMedicamentosUrl(payload);

  const options: NotificationOptions & {
    actions?: Array<{ action: string; title: string }>;
  } = {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url,
      medicationId: payload.medicationId,
      scheduledFor: payload.scheduledFor,
    },
  };

  if (payload.actions !== false) {
    options.actions = [
      { action: "taken", title: "Tomei" },
      { action: "skipped", title: "Não tomei" },
    ];
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = (event.notification.data || {}) as {
    url?: string;
    medicationId?: string;
    scheduledFor?: string;
  };

  let targetUrl = data.url || DEFAULT_URL;
  if (event.action === "taken" || event.action === "skipped") {
    targetUrl = buildMedicamentosUrl(
      {
        medicationId: data.medicationId,
        scheduledFor: data.scheduledFor,
        url: undefined,
      },
      event.action
    );
  }

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
