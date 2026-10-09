"use client";

import { useCallback, useEffect, useState } from "react";
import { pushService } from "../service/pushService";
import { urlBase64ToUint8Array } from "../utils/vapid";

export type PushStatus =
  | "loading"
  | "unsupported"
  | "missing-vapid"
  | "denied"
  | "default"
  | "subscribed"
  | "unsubscribed";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const refreshStatus = useCallback(async () => {
    setError(null);

    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }

    setIosNeedsInstall(isIosDevice() && !isStandaloneDisplay());

    if (!vapidPublicKey) {
      setStatus("missing-vapid");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        setStatus("subscribed");
        return;
      }
      setStatus(
        Notification.permission === "granted" ? "unsubscribed" : "default"
      );
    } catch {
      setStatus("unsupported");
    }
  }, [vapidPublicKey]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const subscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (!vapidPublicKey) {
        throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        throw new Error("Permissão de notificação negada");
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublicKey
          ) as BufferSource,
        });
      }

      await pushService.subscribe(subscription);
      setStatus("subscribed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao ativar lembretes"
      );
      await refreshStatus();
      throw err;
    } finally {
      setBusy(false);
    }
  }, [refreshStatus, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await pushService.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao desativar lembretes"
      );
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await pushService.sendTest();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao enviar notificação de teste"
      );
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    status,
    busy,
    error,
    iosNeedsInstall,
    subscribe,
    unsubscribe,
    sendTest,
    refreshStatus,
  };
}
