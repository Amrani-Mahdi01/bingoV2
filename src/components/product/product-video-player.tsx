"use client";

import * as React from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Branded product video player — replaces the browser's default video
 * controls with a cream/forest/tangerine control bar that matches the
 * store, plus a large centre play button overlay while paused.
 *
 * Lives inside the Embla slider's first slide, so pointer events on the
 * controls call stopPropagation to keep the carousel from swiping while
 * the user scrubs / taps buttons.
 */
export function ProductVideoPlayer({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const seekRef = React.useRef<HTMLDivElement>(null);
  const hideTimer = React.useRef<number | null>(null);

  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [scrubbing, setScrubbing] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  const t = (fr: string, arr: string) => (ar ? arr : fr);

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Reveal controls; while playing, auto-hide after a short idle.
  const reveal = React.useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    const v = videoRef.current;
    if (v && !v.paused) {
      hideTimer.current = window.setTimeout(() => setShowControls(false), 2500);
    }
  }, []);

  React.useEffect(
    () => () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    const v = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (el?.requestFullscreen) {
      void el.requestFullscreen();
    } else if (v?.webkitEnterFullscreen) {
      // iOS Safari only fullscreens the <video> element itself.
      v.webkitEnterFullscreen();
    }
  };

  const seekToClientX = (clientX: number) => {
    const el = seekRef.current;
    const v = videoRef.current;
    if (!el || !v || !v.duration) return;
    const r = el.getBoundingClientRect();
    // Track is laid out LTR even in RTL (time flows left→right).
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    v.currentTime = f * v.duration;
    setCurrent(v.currentTime);
  };

  return (
    <div
      ref={containerRef}
      className="group relative size-full bg-black"
      onPointerMove={reveal}
      onMouseLeave={() => {
        if (videoRef.current && !videoRef.current.paused) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full object-contain"
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          reveal();
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true);
          if (hideTimer.current) window.clearTimeout(hideTimer.current);
        }}
        onTimeUpdate={() => setCurrent(videoRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        onVolumeChange={() => setMuted(!!videoRef.current?.muted)}
      />

      {/* Centre play button — only while paused */}
      {!playing ? (
        <button
          type="button"
          onClick={togglePlay}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t("Lire la vidéo", "تشغيل الفيديو")}
          className={cn(
            "absolute left-1/2 top-1/2 z-10 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full sm:size-20",
            "bg-cream/90 text-forest-900 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] backdrop-blur",
            "transition-transform duration-200 hover:scale-105 hover:bg-cream",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-tangerine-300/50",
          )}
        >
          <Play
            className="size-6 translate-x-0.5 sm:size-8"
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      ) : null}

      {/* Control bar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-3 pb-3 pt-10",
          "bg-gradient-to-t from-forest-900/90 via-forest-900/40 to-transparent",
          "transition-opacity duration-200",
          showControls || !playing ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Seek bar — click or drag to scrub */}
        <div
          ref={seekRef}
          role="slider"
          tabIndex={0}
          aria-label={t("Position de lecture", "موضع التشغيل")}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          dir="ltr"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            setScrubbing(true);
            seekToClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (scrubbing) seekToClientX(e.clientX);
          }}
          onPointerUp={(e) => {
            setScrubbing(false);
            e.currentTarget.releasePointerCapture?.(e.pointerId);
          }}
          className="group/seek relative flex h-4 cursor-pointer items-center"
        >
          <span className="absolute inset-x-0 h-1 rounded-full bg-cream/30" />
          <span
            className="absolute h-1 rounded-full bg-tangerine-500"
            style={{ width: `${progress}%` }}
          />
          <span
            className="absolute size-3 -translate-x-1/2 rounded-full bg-cream opacity-0 shadow transition-opacity group-hover/seek:opacity-100"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-2.5 text-cream">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={
              playing ? t("Pause", "إيقاف مؤقت") : t("Lire la vidéo", "تشغيل الفيديو")
            }
            className="grid size-8 place-items-center rounded-full text-cream transition-colors hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
          >
            {playing ? (
              <Pause className="size-4" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="size-4 translate-x-px" fill="currentColor" strokeWidth={0} />
            )}
          </button>

          <span className="font-mono text-[11px] tabular-nums text-cream/90">
            {fmt(current)} / {fmt(duration)}
          </span>

          <span className="flex-1" />

          <button
            type="button"
            onClick={toggleMute}
            aria-label={
              muted ? t("Activer le son", "تشغيل الصوت") : t("Couper le son", "كتم الصوت")
            }
            className="grid size-8 place-items-center rounded-full text-cream transition-colors hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
          >
            {muted ? (
              <VolumeX className="size-4" strokeWidth={2} />
            ) : (
              <Volume2 className="size-4" strokeWidth={2} />
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={t("Plein écran", "ملء الشاشة")}
            className="grid size-8 place-items-center rounded-full text-cream transition-colors hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
          >
            <Maximize2 className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
