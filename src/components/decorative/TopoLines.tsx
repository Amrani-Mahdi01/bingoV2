import * as React from "react";
import { cn } from "@/lib/utils";

interface TopoLinesProps extends React.SVGAttributes<SVGSVGElement> {
  /** Hex/var for stroke colour. Defaults to forest-100. */
  stroke?: string;
  /** Opacity 0-1. Default 1 (set stroke to a faint colour for layering). */
  opacity?: number;
}

/**
 * Faint topographic contour SVG — drawn as nested concentric closed paths
 * suggesting elevation lines on a map. Designed as a decorative hero
 * background; pair with a `cream` surface.
 *
 * Renders absolutely-positioned by default so it sits behind hero content.
 */
export function TopoLines({
  stroke = "var(--color-forest-100)",
  opacity = 1,
  className,
  ...props
}: TopoLinesProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn("absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
      {...props}
    >
      <g fill="none" stroke={stroke} strokeWidth="1.25">
        {/* Concentric blobs forming a topographic relief */}
        <path d="M -50 320 Q 150 240 320 290 T 660 270 T 980 300 T 1260 280" />
        <path d="M -50 360 Q 150 280 320 330 T 660 310 T 980 340 T 1260 320" />
        <path d="M -50 400 Q 150 320 320 370 T 660 350 T 980 380 T 1260 360" />
        <path d="M -50 440 Q 150 360 320 410 T 660 390 T 980 420 T 1260 400" />
        <path d="M -50 480 Q 150 400 320 450 T 660 430 T 980 460 T 1260 440" />
        <path d="M -50 520 Q 150 440 320 490 T 660 470 T 980 500 T 1260 480" />

        {/* A peak cluster centred-left */}
        <path d="M 100 260 Q 200 140 320 200 Q 440 260 360 320 Q 280 340 220 320 Q 140 300 100 260 Z" />
        <path d="M 130 260 Q 210 170 310 210 Q 410 250 350 305 Q 290 320 230 305 Q 170 285 130 260 Z" />
        <path d="M 160 260 Q 220 200 300 220 Q 380 240 340 290 Q 290 300 240 290 Q 200 280 160 260 Z" />
        <path d="M 195 255 Q 235 220 290 230 Q 345 240 320 275 Q 290 285 255 280 Q 220 275 195 255 Z" />

        {/* A peak cluster centred-right */}
        <path d="M 720 220 Q 820 100 940 160 Q 1060 220 980 280 Q 900 300 820 280 Q 760 260 720 220 Z" />
        <path d="M 750 220 Q 830 130 930 170 Q 1030 210 970 265 Q 910 280 850 265 Q 790 245 750 220 Z" />
        <path d="M 780 220 Q 840 160 920 180 Q 1000 200 960 250 Q 910 260 860 250 Q 820 240 780 220 Z" />
        <path d="M 815 215 Q 855 180 910 190 Q 965 200 940 235 Q 910 245 875 240 Q 840 235 815 215 Z" />

        {/* Lower ridge running across the bottom */}
        <path d="M -50 580 Q 200 540 400 560 T 800 555 T 1260 565" />
      </g>
    </svg>
  );
}

export default TopoLines;
