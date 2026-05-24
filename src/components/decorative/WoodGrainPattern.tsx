import * as React from "react";
import { cn } from "@/lib/utils";

interface WoodGrainPatternProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Opacity 0-1 of the displacement overlay. Default 0.10 (within 8-12% spec). */
  opacity?: number;
  /** Unique seed for the filter id when many overlays share a page. */
  seed?: string;
}

/**
 * Wood-grain texture overlay.
 *
 * Place inside a `.wood-grain` container (or any `position: relative` parent
 * with a wood-coloured background). Renders as a `.wood-grain-overlay` —
 * absolutely positioned, pointer-events disabled, composited via mix-blend-mode.
 *
 * The grain is generated client/server-side from SVG `<feTurbulence>` +
 * `<feDisplacementMap>` — no raster assets.
 */
export function WoodGrainPattern({
  opacity = 0.1,
  seed = "wood",
  className,
  ...props
}: WoodGrainPatternProps) {
  const filterId = `wood-grain-${seed}`;
  return (
    <div
      aria-hidden="true"
      className={cn("wood-grain-overlay mix-blend-overlay", className)}
      style={{ opacity }}
      {...props}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={filterId} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.04 0.6"
              numOctaves="2"
              seed="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="#3a1f0a"
          filter={`url(#${filterId})`}
        />
      </svg>
    </div>
  );
}

export default WoodGrainPattern;
