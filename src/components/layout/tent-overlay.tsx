"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Global tent transition overlay — mounted once at the root layout.
 *
 * Phase machine:
 *   idle    → no overlay rendered, page is normal
 *   closing → flaps slide IN from off-screen to the seam (800 ms),
 *             the OLD page still shows behind them
 *   held    → flaps fully closed, BINGO wordmark centered (400 ms);
 *             this is where the router.push() actually fires, so the
 *             page swap happens hidden behind the tent canvas
 *   opening → flaps slide back OUT (1100 ms), revealing the NEW page
 *
 * Triggered by a CustomEvent "tent-navigate" with detail { href }.
 * Use the `<TentLink>` component to fire it.
 */
type Phase = "idle" | "closing" | "held" | "opening";

export function TentOverlay() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const hrefRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ href: string }>).detail;
      if (!detail?.href) return;
      hrefRef.current = detail.href;
      setPhase("closing");
    };
    window.addEventListener("tent-navigate", handler);
    return () => window.removeEventListener("tent-navigate", handler);
  }, []);

  React.useEffect(() => {
    if (phase === "closing") {
      const t = window.setTimeout(() => {
        if (hrefRef.current) {
          router.push(hrefRef.current);
          hrefRef.current = null;
        }
        setPhase("held");
      }, 800);
      return () => window.clearTimeout(t);
    }
    if (phase === "held") {
      const t = window.setTimeout(() => setPhase("opening"), 450);
      return () => window.clearTimeout(t);
    }
    if (phase === "opening") {
      const t = window.setTimeout(() => setPhase("idle"), 1100);
      return () => window.clearTimeout(t);
    }
  }, [phase, router]);

  if (phase === "idle") return null;

  const closing = phase === "closing";
  const held = phase === "held";
  const opening = phase === "opening";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex"
    >
      <style>{`
        @keyframes tent-close-left  { from { transform: translateX(-102%); } to { transform: translateX(0); } }
        @keyframes tent-close-right { from { transform: translateX(102%);  } to { transform: translateX(0); } }
        @keyframes tent-open-left   { from { transform: translateX(0);     } to { transform: translateX(-102%); } }
        @keyframes tent-open-right  { from { transform: translateX(0);     } to { transform: translateX(102%);  } }

        .tent-flap-closing-left  { animation: tent-close-left  800ms cubic-bezier(0.55, 0.05, 0.25, 1) forwards; }
        .tent-flap-closing-right { animation: tent-close-right 800ms cubic-bezier(0.55, 0.05, 0.25, 1) forwards; }
        .tent-flap-held          { transform: translateX(0); }
        .tent-flap-opening-left  { animation: tent-open-left  1100ms cubic-bezier(0.55, 0.05, 0.25, 1) forwards; }
        .tent-flap-opening-right { animation: tent-open-right 1100ms cubic-bezier(0.55, 0.05, 0.25, 1) forwards; }

        /* Zipper slider — sits at the top while closing+held, then
           crawls down during opening. */
        @keyframes tent-zipper-down {
          from { top: 0; }
          to   { top: 100%; }
        }
        .tent-zipper-top  { top: 0; }
        .tent-zipper-down { animation: tent-zipper-down 1100ms cubic-bezier(0.55, 0.05, 0.25, 1) forwards; }
      `}</style>

      {/* ─── LEFT FLAP (carries the LEFT half of BINGO) ─── */}
      <div
        className={cn(
          "relative h-full w-1/2 overflow-hidden bg-forest-900",
          closing && "tent-flap-closing-left",
          held && "tent-flap-held",
          opening && "tent-flap-opening-left"
        )}
        style={
          closing
            ? { transform: "translateX(-102%)" }
            : held || opening
              ? { transform: "translateX(0)" }
              : undefined
        }
      >
        <SeamTexture />
        <div className="absolute inset-y-0 left-0 flex w-[200%] items-center justify-center">
          <h2 className="whitespace-nowrap font-display font-bold leading-none tracking-[-0.05em] text-cream text-[110px] sm:text-[170px] md:text-[230px] lg:text-[280px]">
            BINGO<span className="ms-1 text-tangerine-500">.</span>
          </h2>
        </div>
        <ZipperEdge side="right" />
      </div>

      {/* ─── RIGHT FLAP (carries the RIGHT half of BINGO) ─── */}
      <div
        className={cn(
          "relative h-full w-1/2 overflow-hidden bg-forest-900",
          closing && "tent-flap-closing-right",
          held && "tent-flap-held",
          opening && "tent-flap-opening-right"
        )}
        style={
          closing
            ? { transform: "translateX(102%)" }
            : held || opening
              ? { transform: "translateX(0)" }
              : undefined
        }
      >
        <SeamTexture />
        <div className="absolute inset-y-0 right-0 flex w-[200%] items-center justify-center">
          <h2 className="whitespace-nowrap font-display font-bold leading-none tracking-[-0.05em] text-cream text-[110px] sm:text-[170px] md:text-[230px] lg:text-[280px]">
            BINGO<span className="ms-1 text-tangerine-500">.</span>
          </h2>
        </div>
        <ZipperEdge side="left" />
      </div>

      {/* Zipper slider — tangerine puck at the seam */}
      <div className="pointer-events-none fixed left-1/2 z-[101] -translate-x-1/2">
        <div
          className={cn(
            "relative",
            (closing || held) && "tent-zipper-top",
            opening && "tent-zipper-down"
          )}
        >
          <div className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-tangerine-500 shadow-[0_2px_8px_rgba(237,138,60,0.55)]">
            <div className="size-2 rounded-full bg-cream/95" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SeamTexture() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full opacity-60"
    >
      <g fill="none" stroke="#f5efe0" strokeOpacity="0.08" strokeWidth="0.2">
        {Array.from({ length: 18 }).map((_, j) => {
          const y = 3 + j * 5.4;
          return (
            <path
              key={j}
              d={`M -2 ${y} Q ${20 + (j % 4) * 8} ${y - 0.4} 50 ${y} T 102 ${y + 0.4}`}
            />
          );
        })}
      </g>
    </svg>
  );
}

function ZipperEdge({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-y-0 flex flex-col items-stretch",
        side === "left" ? "left-0" : "right-0"
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 w-px bg-tangerine-500/70",
          side === "left" ? "left-0" : "right-0"
        )}
      />
      <svg
        viewBox="0 0 8 200"
        preserveAspectRatio="none"
        className={cn(
          "absolute inset-y-0 w-2",
          side === "left" ? "left-0" : "right-0"
        )}
      >
        <g fill="#ed8a3c" fillOpacity="0.55">
          {Array.from({ length: 100 }).map((_, i) => (
            <rect key={i} x="0" y={i * 2 + 0.3} width="8" height="1.2" rx="0.4" />
          ))}
        </g>
      </svg>
    </div>
  );
}
