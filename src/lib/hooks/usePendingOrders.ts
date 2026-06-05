"use client";

import * as React from "react";

import { adminToken, HttpError } from "@/lib/api/http";
import { ordersApi } from "@/lib/api/orders";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/** Window event consumers can dispatch to force an immediate
 *  refresh of the pending-orders count. Also fired by the SSE handler
 *  whenever the count changes — components that render orders (the
 *  /admin/orders table) can listen and refetch their own data. */
export const PENDING_ORDERS_REFRESH_EVENT = "bingo:pending-orders-refresh";

/** BroadcastChannel name used to coordinate the admin sidebar with
 *  other same-origin tabs (typically the customer storefront). Any
 *  tab can post into this channel and every other tab that has the
 *  admin shell mounted will refresh its pending-orders count, even
 *  while that admin tab is hidden in the background. Falls back to
 *  the per-tab REFRESH_EVENT when BroadcastChannel isn't available. */
export const PENDING_ORDERS_BROADCAST = "bingo:pending-orders";

// Local aliases — kept short for use inside this file.
const REFRESH_EVENT = PENDING_ORDERS_REFRESH_EVENT;
const BROADCAST_NAME = PENDING_ORDERS_BROADCAST;

/** Call this after any action that may have changed the count of
 *  pending orders (e.g. an admin moving a row to "delivered" or
 *  "cancelled", or the storefront just placing a new one). The
 *  sidebar badge + tab title update immediately instead of waiting
 *  for the next poll tick. Broadcasts to other tabs too. */
export function refreshPendingOrders(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REFRESH_EVENT));
  // Same-origin cross-tab nudge. Any open admin tab — even hidden
  // ones being throttled by the browser — will receive this and
  // re-fetch the count. The browser still processes BroadcastChannel
  // messages on background tabs reliably.
  try {
    if ("BroadcastChannel" in window) {
      const ch = new BroadcastChannel(BROADCAST_NAME);
      ch.postMessage({ type: "refresh", at: Date.now() });
      ch.close();
    }
  } catch {
    /* ignore — best effort, polling will catch up */
  }
}

/**
 * Live feed of pending-orders count for the admin shell. Returns the
 * latest count and mirrors it into `document.title` ("(N) Admin BINGO")
 * so the browser tab shows new orders the same way Facebook surfaces
 * unread messages — even when the admin is on another tab.
 *
 * Update strategy (in priority order):
 *   1. **SSE** — primary. EventSource against
 *      `/api/admin/orders/stream?token=…`. The server pushes the count
 *      the instant it changes, so background-tab throttling on the
 *      client side doesn't matter (the browser still delivers SSE
 *      messages on hidden tabs). The server auto-closes the stream
 *      every ~25 s and EventSource reconnects.
 *   2. **Polling fallback** — kicks in when SSE isn't available (no
 *      admin token, EventSource unsupported, repeated stream errors).
 *      Hits /api/admin/orders/pending-count every `intervalMs`.
 *   3. **Imperative refresh** — `refreshPendingOrders()` from the
 *      same browser triggers an instant re-fetch via the REFRESH_EVENT
 *      window event AND the BroadcastChannel cross-tab message.
 *   4. **On `visibilitychange` to visible** — immediate fetch so the
 *      badge is always fresh the moment the admin re-focuses, even if
 *      SSE was paused.
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
    let eventSource: EventSource | null = null;
    // Tracks consecutive SSE errors. If the stream keeps failing
    // (server down, route 404, CORS) we give up after 3 retries and
    // fall back to plain polling.
    let sseFailures = 0;
    let mode: "sse" | "polling" = "polling";

    const handleCount = (n: number) => {
      if (!cancelled) setCount(n);
    };

    // ── One-off fetch (used by polling + every imperative refresh) ──
    const fetchOnce = async () => {
      try {
        const n = await ordersApi.pendingCount();
        handleCount(n);
      } catch (err) {
        if (!(err instanceof HttpError && err.status === 401)) {
          console.warn("[usePendingOrders] fetch failed", err);
        }
      }
    };

    // ── Polling fallback loop ───────────────────────────────────────
    const startPolling = () => {
      mode = "polling";
      const tick = async () => {
        await fetchOnce();
        if (!cancelled && mode === "polling") {
          timer = setTimeout(tick, intervalMs);
        }
      };
      void tick();
    };

    // ── SSE — primary path ──────────────────────────────────────────
    const startStreaming = () => {
      const token = adminToken.get();
      if (!token || typeof EventSource === "undefined") {
        startPolling();
        return;
      }
      mode = "sse";
      const url = `${API_URL}/api/admin/orders/stream?token=${encodeURIComponent(token)}`;
      try {
        eventSource = new EventSource(url);
      } catch {
        // Synchronous failure → give up immediately.
        sseFailures = 3;
        startPolling();
        return;
      }

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { pending?: number };
          if (typeof data.pending === "number") {
            handleCount(data.pending);
            sseFailures = 0;
            // Backend only pushes on actual change (see
            // OrderController::stream). Let other admin views — most
            // importantly the /admin/orders table — know they should
            // refetch. The orders page listens for this same event.
            window.dispatchEvent(new Event(REFRESH_EVENT));
          }
        } catch {
          /* malformed — ignore */
        }
      };

      // Server emits this event right before closing the connection
      // (every ~25 s). EventSource will reconnect on its own.
      eventSource.addEventListener("close", () => {
        // No-op; reconnection is automatic.
      });

      eventSource.onerror = () => {
        sseFailures += 1;
        if (sseFailures >= 3) {
          // SSE keeps blowing up — close it and switch to polling.
          eventSource?.close();
          eventSource = null;
          if (mode === "sse") {
            console.warn(
              "[usePendingOrders] SSE failed 3× in a row, falling back to polling",
            );
            startPolling();
          }
        }
        // Else let EventSource auto-reconnect.
      };
    };

    // Kick off — primary first, polling falls in if SSE bails.
    startStreaming();
    // Always do one immediate fetch so the badge isn't null on first
    // paint (SSE's first push may take a beat).
    void fetchOnce();

    // When the admin returns to the tab, force a fetch even if SSE
    // says it's healthy. Belt-and-suspenders.
    const onVisibility = () => {
      if (!document.hidden && !cancelled) {
        void fetchOnce();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Immediate refresh hook — dispatched by refreshPendingOrders()
    // after any mutation that may have changed the count.
    const onForceRefresh = () => {
      void fetchOnce();
    };
    window.addEventListener(REFRESH_EVENT, onForceRefresh);

    // Cross-tab nudge — survives background-tab throttling because
    // BroadcastChannel messages are delivered to hidden tabs without
    // the timer throttling treatment.
    let channel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel(BROADCAST_NAME);
        channel.onmessage = () => onForceRefresh();
      }
    } catch {
      /* ignore — polling/SSE will still cover us */
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      eventSource?.close();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(REFRESH_EVENT, onForceRefresh);
      channel?.close();
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
