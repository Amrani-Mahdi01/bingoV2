"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";

/**
 * BINGO hero — animated tipi camp, BINGO wordmark centered, scroll cue.
 *
 * Mobile-resilience pattern:
 *   - Default CSS state for every element is its FINAL, fully-visible
 *     state (so if a browser refuses to honor animations, the page
 *     still renders correctly — Oppo/HeytapBrowser/etc.).
 *   - Animations are gated behind `.hero-mounted` which is added via
 *     JS after the first paint. Inside each @keyframes block we
 *     explicitly declare `from { hidden }` and use
 *     `animation-fill-mode: backwards`, so the from-state is only
 *     applied during the animation's delay window. If the engine
 *     refuses the animation, the element falls back to its visible
 *     default rather than getting stuck hidden.
 *   - No prefers-reduced-motion override — content stays visible
 *     even with system reduce-motion on, animations just don't play.
 */
export function Hero() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Double rAF gets us past hydration + first paint reliably across
    // browsers that throttle JS during hydration.
    const id1 = window.requestAnimationFrame(() => {
      const id2 = window.requestAnimationFrame(() => setMounted(true));
      // Stash on the outer ref so cleanup works.
      // (No nested cleanup needed since both rAFs are short-lived.)
      void id2;
    });
    return () => window.cancelAnimationFrame(id1);
  }, []);

  const letters = "BINGO".split("");

  return (
    <section
      aria-labelledby="hero-title"
      className={`relative isolate flex flex-col overflow-hidden bg-gradient-to-b from-cream via-wood-100/40 to-wood-200/60 ${
        mounted ? "hero-mounted" : ""
      }`}
      style={{ minHeight: "calc(100vh - 104px)" }}
    >
      <style>{`
        /* ──────────── TIPI ASSEMBLY ──────────── */
        /* Default = fully drawn (dashoffset 0). Animation provides the
           draw-in effect via @keyframes from { dashoffset: 100; }. */
        .tipi-line { stroke-dasharray: 100; }

        .hero-mounted .tipi-ground       { animation: tipi-draw 600ms cubic-bezier(0.4,0,0.2,1) 200ms backwards; }
        .hero-mounted .tipi-pole-left    { animation: tipi-draw 650ms cubic-bezier(0.34,1.25,0.64,1) 650ms backwards; }
        .hero-mounted .tipi-pole-right   { animation: tipi-draw 650ms cubic-bezier(0.34,1.25,0.64,1) 780ms backwards; }
        .hero-mounted .tipi-fabric-stroke{ animation: tipi-draw 900ms cubic-bezier(0.4,0,0.2,1) 1100ms backwards; }
        @keyframes tipi-draw {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0;   }
        }

        .hero-mounted .tipi-fabric-fill  { animation: tipi-fade-in 800ms ease-out 1500ms backwards; }
        .hero-mounted .tipi-detail       { animation: tipi-fade-in 500ms ease-out 1950ms backwards; }
        @keyframes tipi-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .hero-mounted .tipi-stake-left   { animation: tipi-stake-in 380ms cubic-bezier(0.34,1.6,0.64,1) 2150ms backwards; }
        .hero-mounted .tipi-stake-right  { animation: tipi-stake-in 380ms cubic-bezier(0.34,1.6,0.64,1) 2280ms backwards; }
        @keyframes tipi-stake-in {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .tipi-flag { transform-origin: 300px 55px; }
        .hero-mounted .tipi-flag {
          animation:
            tipi-flag-pop  500ms cubic-bezier(0.34,1.8,0.64,1) 2350ms backwards,
            tipi-flag-wave 3.8s ease-in-out 3000ms infinite;
        }
        @keyframes tipi-flag-pop  {
          from { opacity: 0; transform: scale(0) rotate(-18deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg);   }
        }
        @keyframes tipi-flag-wave {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%      { transform: scale(1) rotate(-5deg); }
        }

        /* ──────────── CAMPFIRE ──────────── */
        .tipi-fire { transform-origin: 360px 408px; }
        .hero-mounted .tipi-fire {
          animation:
            tipi-fire-ignite  650ms ease-out 2500ms backwards,
            tipi-fire-flicker 380ms ease-in-out 3200ms infinite;
        }
        @keyframes tipi-fire-ignite {
          0%   { opacity: 0; transform: scale(0); }
          70%  { opacity: 1; transform: scale(1.18); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes tipi-fire-flicker {
          0%, 100% { transform: scale(1, 1)       rotate(0deg);   }
          25%      { transform: scale(0.93, 1.10) rotate(-2deg);  }
          50%      { transform: scale(1.06, 0.94) rotate(1.5deg); }
          75%      { transform: scale(0.97, 1.05) rotate(-1deg);  }
        }

        .hero-mounted .tipi-ember { animation: tipi-ember-rise 2.6s ease-out infinite; }
        .hero-mounted .tipi-ember-1 { animation-delay: 3.0s; }
        .hero-mounted .tipi-ember-2 { animation-delay: 3.9s; }
        .hero-mounted .tipi-ember-3 { animation-delay: 4.8s; }
        @keyframes tipi-ember-rise {
          0%   { opacity: 0;   transform: translate(0,0); }
          15%  { opacity: 0.95; }
          70%  { opacity: 0.45; }
          100% { opacity: 0;   transform: translate(-14px,-130px); }
        }

        .hero-mounted .tipi-smoke { animation: tipi-smoke-rise 4.4s ease-out infinite; }
        .hero-mounted .tipi-smoke-1 { animation-delay: 2.6s; }
        .hero-mounted .tipi-smoke-2 { animation-delay: 4.1s; }
        .hero-mounted .tipi-smoke-3 { animation-delay: 5.5s; }
        @keyframes tipi-smoke-rise {
          0%   { opacity: 0;    transform: translate(0,0)         scale(0.5); }
          20%  { opacity: 0.55; }
          70%  { opacity: 0.28; }
          100% { opacity: 0;    transform: translate(-32px,-190px) scale(1.8); }
        }

        /* ──────────── SCENE BLUR + IDLE DRIFT ──────────── */
        /* Default = blurred. JS-triggered animation transitions from
           sharp to blur. So even on browsers that ignore animations,
           the tipi is blurred (which is the intended final state). */
        .tipi-scene { filter: blur(7px); opacity: 0.4; transform: scale(1.06); transform-origin: center; will-change: filter, opacity, transform; }
        .hero-mounted .tipi-scene {
          animation:
            tipi-scene-blur  1200ms cubic-bezier(0.4,0,0.2,1) 3000ms backwards,
            tipi-scene-drift 16s    ease-in-out                4400ms infinite;
        }
        @keyframes tipi-scene-blur {
          from { filter: blur(0);    opacity: 1;   transform: scale(1);    }
          to   { filter: blur(7px);  opacity: 0.4; transform: scale(1.06); }
        }
        @keyframes tipi-scene-drift {
          0%, 100% { filter: blur(7px); opacity: 0.4;  transform: translateX(0)    scale(1.06); }
          50%      { filter: blur(7px); opacity: 0.45; transform: translateX(-5px) scale(1.06); }
        }

        /* ──────────── BINGO WORDMARK ──────────── */
        /* Default = visible. Animations gated behind .hero-mounted. */
        .hero-bingo-letter { display: inline-block; will-change: transform, opacity; }
        .hero-mounted .hero-bingo-letter {
          animation:
            hero-bingo-enter 750ms cubic-bezier(0.16,1,0.3,1) backwards,
            hero-bingo-wave  2.8s  ease-in-out                infinite;
        }
        @keyframes hero-bingo-enter {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes hero-bingo-wave  {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }

        .hero-bingo-dot { display: inline-block; transform-origin: center; will-change: transform, opacity; }
        .hero-mounted .hero-bingo-dot {
          animation:
            hero-dot-pop   500ms cubic-bezier(0.34,1.8,0.64,1) backwards,
            hero-dot-pulse 2.8s  ease-in-out                   infinite;
        }
        @keyframes hero-dot-pop   {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes hero-dot-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.22); } }

        .hero-rule { transform-origin: center; }
        .hero-mounted .hero-rule { animation: hero-rule-in 700ms cubic-bezier(0.16,1,0.3,1) 4400ms backwards; }
        @keyframes hero-rule-in {
          from { opacity: 0; transform: scaleX(0); }
          to   { opacity: 1; transform: scaleX(1); }
        }

        .hero-mounted .hero-tagline { animation: hero-tagline-in 700ms ease-out 4500ms backwards; }
        @keyframes hero-tagline-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        /* ──────────── SCROLL INDICATOR ──────────── */
        .hero-mounted .hero-scroll { animation: hero-tagline-in 700ms ease-out 4900ms backwards; }
        .hero-scroll-arrow { will-change: transform; }
        .hero-mounted .hero-scroll-arrow {
          animation: hero-scroll-bounce 1.8s cubic-bezier(0.5,0,0.5,1) 5600ms infinite;
        }
        @keyframes hero-scroll-bounce {
          0%, 100% { transform: translateY(0);   opacity: 1;   }
          50%      { transform: translateY(6px); opacity: 0.6; }
        }
      `}</style>

      {/* TIPI SCENE */}
      <div className="tipi-scene pointer-events-none absolute inset-0 z-[1] grid place-items-center">
        <svg
          aria-hidden
          viewBox="0 0 600 480"
          preserveAspectRatio="xMidYMax meet"
          className="h-[72%] w-auto max-h-[560px] max-w-[80%]"
        >
          <line pathLength={100} className="tipi-line tipi-ground" x1="100" y1="400" x2="500" y2="400" stroke="#5b452a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line pathLength={100} className="tipi-line tipi-pole-left"  x1="200" y1="400" x2="280" y2="34" stroke="#3d341f" strokeWidth="3" strokeLinecap="round" fill="none" />
          <line pathLength={100} className="tipi-line tipi-pole-right" x1="400" y1="400" x2="320" y2="34" stroke="#3d341f" strokeWidth="3" strokeLinecap="round" fill="none" />

          <path className="tipi-fabric-fill" d="M 160 400 L 300 60 L 440 400 Z" fill="#c9b58e" />
          <path pathLength={100} className="tipi-line tipi-fabric-stroke" d="M 160 400 L 300 60 L 440 400 Z" fill="none" stroke="#5b452a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          <g className="tipi-detail" stroke="#7a6035" strokeWidth="1.5" strokeLinecap="round" fill="none">
            <path d="M 300 60 L 232 400" opacity="0.55" />
            <path d="M 300 60 L 368 400" opacity="0.55" />
            <path d="M 300 400 L 300 252" strokeWidth="2" />
            <path d="M 288 252 Q 300 232 312 252" strokeWidth="1.5" />
          </g>

          <ellipse className="tipi-detail" cx="300" cy="74" rx="14" ry="6" fill="#3d341f" opacity="0.85" />

          <line className="tipi-stake-left"  x1="155" y1="395" x2="155" y2="414" stroke="#3d341f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line className="tipi-stake-right" x1="445" y1="395" x2="445" y2="414" stroke="#3d341f" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          <g className="tipi-flag">
            <line x1="300" y1="55" x2="300" y2="22" stroke="#3d341f" strokeWidth="1.5" />
            <path d="M 300 26 L 322 33 L 300 40 Z" fill="#ed8a3c" />
          </g>

          <g fill="#9c7e48">
            <ellipse className="tipi-smoke tipi-smoke-1" cx="300" cy="55" rx="9"  ry="6" />
            <ellipse className="tipi-smoke tipi-smoke-2" cx="296" cy="55" rx="10" ry="7" />
            <ellipse className="tipi-smoke tipi-smoke-3" cx="303" cy="55" rx="8"  ry="6" />
          </g>

          <g className="tipi-fire">
            <line x1="343" y1="409" x2="377" y2="402" stroke="#5b452a" strokeWidth="4" strokeLinecap="round" />
            <line x1="343" y1="402" x2="377" y2="409" stroke="#7a6035" strokeWidth="4" strokeLinecap="round" />
            <path
              d="M 360 411 C 348 400, 348 386, 354 378 C 358 383, 362 385, 364 380 C 366 374, 368 368, 372 377 C 376 388, 370 400, 360 411 Z"
              fill="#ed8a3c" opacity="0.9"
            />
            <path
              d="M 360 408 C 354 400, 354 391, 358 386 C 360 389, 362 390, 363 387 C 365 383, 366 379, 368 385 C 370 393, 366 401, 360 408 Z"
              fill="#fac38a" opacity="0.95"
            />
          </g>

          <g fill="#ed8a3c">
            <circle className="tipi-ember tipi-ember-1" cx="362" cy="385" r="1.5" />
            <circle className="tipi-ember tipi-ember-2" cx="358" cy="385" r="1.2" />
            <circle className="tipi-ember tipi-ember-3" cx="365" cy="385" r="1"   />
          </g>
        </svg>
      </div>

      {/* BINGO wordmark — centered */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1
          id="hero-title"
          className="font-display font-bold leading-[0.86] tracking-[-0.05em] text-forest-900 text-[88px] sm:text-[136px] md:text-[184px] lg:text-[224px]"
        >
          {letters.map((char, i) => (
            <span
              key={i}
              aria-hidden={i > 0}
              className="hero-bingo-letter"
              style={{ animationDelay: `${3400 + i * 90}ms, ${4150 + i * 160}ms` }}
            >
              {char}
            </span>
          ))}
          <span
            aria-hidden
            className="hero-bingo-dot ms-1 text-tangerine-500"
            style={{ animationDelay: "3900ms, 4400ms" }}
          >
            .
          </span>
          <span className="sr-only">BINGO</span>
        </h1>

        <div aria-hidden className="hero-rule mt-5 h-px w-20 bg-wood-700/40 sm:mt-7 sm:w-24" />

        <p className="hero-tagline mt-4 max-w-md font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine-700 sm:mt-5 sm:text-sm">
          Le matériel d&apos;aventure, côte à côte.
        </p>

        <div className="hero-scroll mt-10 flex items-center gap-2 sm:mt-12" aria-hidden>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-wood-700/70">
            Défiler
          </span>
          <ArrowDown
            className="hero-scroll-arrow size-4 text-forest-900"
            strokeWidth={2.2}
          />
        </div>
      </div>
    </section>
  );
}
