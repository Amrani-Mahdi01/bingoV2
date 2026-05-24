"use client";

import * as React from "react";

import { HttpError } from "@/lib/api/http";
import { ordersApi } from "@/lib/api/orders";

/**
 * Polls /api/admin/orders/pending-count every 20 seconds while the
 * admin shell is mounted. Returns the latest count, plus mirrors the
 * count into `document.title` ("(N) Admin BINGO") so the browser tab
 * shows new orders the same way Facebook surfaces unread messages.
 *
 * Polling intentionally pauses when the tab is hidden (visibilitychange)
 * — there's no point hammering the backend when no one is looking.
 */
export function usePendingOrders(intervalMs = 20_000) {
  const [count, setCount] = React.useState<number | null>(null);
  const baseTitleRef = React.useRef<string>("");

  React.useEffect(() => {
    if (!baseTitleRef.current && typeof document !== "undefined") {
      baseTitleRef.current = document.title.replace(/^\(\d+\)\s*/, "");
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const n = await ordersApi.pendingCount();
        if (!cancelled) setCount(n);
      } catch (err) {
        // 401 = not logged in (e.g. on /admin/login itself) — just stay quiet
        if (!(err instanceof HttpError && err.status === 401)) {
          console.warn("[usePendingOrders] poll failed", err);
        }
      } finally {
        if (!cancelled && !document.hidden) {
          timer = setTimeout(tick, intervalMs);
        }
      }
    };

    void tick();

    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
        timer = null;
      } else if (!timer && !cancelled) {
        void tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  // Sync into document.title whenever the count changes.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const base = baseTitleRef.current || "Admin BINGO";
    if (count && count > 0) {
      document.title = `(${count}) ${base}`;
    } else {
      document.title = base;
    }
  }, [count]);

  return count;
}
