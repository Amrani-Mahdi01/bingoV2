"use client";

import * as React from "react";
import { Mountain } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * First-load splash overlay.
 *
 * Covers the page with a branded loader on the initial hard load / refresh,
 * then fades out once the page has fully loaded (fonts, hero image, CSS, JS).
 * It lives in the root layout and mounts ONCE, so it never re-appears on
 * client-side (SPA) navigation — only the first paint.
 *
 * Safety first: on a flaky mobile connection the `load` event can be very late
 * (or effectively never fire if a resource hangs). A hard MAX cap guarantees the
 * splash always disappears, so it can never trap the user behind a spinner —
 * that would be worse than a page that's still filling in. A small MIN avoids a
 * jarring flash on fast connections.
 */
const MIN_MS = 350;
const MAX_MS = 5000;
const FADE_MS = 500;

export function PageLoader() {
  const [hidden, setHidden] = React.useState(false);
  const [removed, setRemoved] = React.useState(false);

  React.useEffect(() => {
    const start = performance.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      window.setTimeout(() => setHidden(true), wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }
    // Hard cap — the splash NEVER outlives this, even if `load` never fires.
    const cap = window.setTimeout(finish, MAX_MS);

    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(cap);
    };
  }, []);

  // Drop it from the DOM once faded, so it can't intercept clicks.
  React.useEffect(() => {
    if (!hidden) return;
    const t = window.setTimeout(() => setRemoved(true), FADE_MS);
    return () => window.clearTimeout(t);
  }, [hidden]);

  if (removed) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-7 bg-cream transition-opacity ease-out",
        hidden ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      {/* Brand mark — mirrors the header's fallback logo. */}
      <div className="flex items-center gap-2 text-forest-900">
        <Mountain className="size-8 sm:size-9" strokeWidth={2} />
        <span className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          BINGO
        </span>
      </div>

      {/* Spinner */}
      <span
        className="size-8 animate-spin rounded-full border-[3px] border-forest-700/20 border-t-forest-700"
        role="status"
        aria-label="Chargement"
      />
    </div>
  );
}
