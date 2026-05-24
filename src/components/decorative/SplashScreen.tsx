"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const SPLASH_KEY = "bingo-splash-v1";
const HOLD_MS = 1500;
const FADE_MS = 500;

/**
 * First-visit splash: animates the BINGO wordmark + tangerine accent square,
 * holds for a beat, then fades out. Re-entries within the same browser
 * session skip it entirely (sessionStorage gate).
 */
export function SplashScreen() {
  const [show, setShow] = React.useState(true);
  const [fadeOut, setFadeOut] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Already shown this session — drop immediately, no flash.
    if (sessionStorage.getItem(SPLASH_KEY)) {
      setShow(false);
      return;
    }
    sessionStorage.setItem(SPLASH_KEY, "1");

    const fadeTimer = window.setTimeout(() => setFadeOut(true), HOLD_MS);
    const removeTimer = window.setTimeout(
      () => setShow(false),
      HOLD_MS + FADE_MS
    );
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-cream transition-opacity ease-out",
        fadeOut ? "pointer-events-none opacity-0" : "opacity-100"
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="flex items-end gap-3 sm:gap-4">
        {/* BINGO wordmark — letter-by-letter rise */}
        <div className="flex font-display text-5xl font-semibold leading-none tracking-tight text-ink sm:text-6xl md:text-7xl">
          {Array.from("BINGO").map((ch, i) => (
            <span
              key={i}
              className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
              style={{
                animationDelay: `${i * 90}ms`,
                animationFillMode: "both",
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Brand accent square — slides in from left, like the Header logo */}
        <span
          aria-hidden="true"
          className="block h-8 w-10 rounded-sm bg-tangerine-500 animate-in fade-in slide-in-from-left-2 duration-700 ease-out sm:h-10 sm:w-12 md:h-12 md:w-14"
          style={{
            animationDelay: "560ms",
            animationFillMode: "both",
          }}
        />
      </div>

      {/* Tagline — fades in last */}
      <p
        className="absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-2xs uppercase tracking-[0.2em] text-tangerine-600 animate-in fade-in duration-1000 ease-out sm:text-xs"
        style={{ animationDelay: "850ms", animationFillMode: "both" }}
      >
        Équipement outdoor — Algérie
      </p>
    </div>
  );
}
