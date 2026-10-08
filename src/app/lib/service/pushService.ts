import type { PushSubscriptionPayload } from "../types/medications";

class PushService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : null) || `Erro na requisição (${res.status})`;
      throw new Error(message);
    }

    return data as T;
  }

  toPayload(subscription: PushSubscription): PushSubscriptionPayload {
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error("Subscription de push incompleta");
    }

    return {
      endpoint: json.endpoint,
      expirationTime: json.expirationTime ?? null,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
  }

  async subscribe(subscription: PushSubscription): Promise<void> {
    await this.request("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(this.toPayload(subscription)),
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.request("/api/push/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    });
  }

  async sendTest(): Promise<void> {
    await this.request("/api/push/test", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }
}

export const pushService = new PushService();
