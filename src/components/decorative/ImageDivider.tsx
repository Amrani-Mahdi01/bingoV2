import Image from "next/image";

import { cn } from "@/lib/utils";

interface ImageDividerProps {
  src: string;
  alt?: string;
  quote?: string;
  attribution?: string;
  className?: string;
}

/**
 * Full-bleed photo strip used between homepage sections.
 * Darkening scrim ensures any overlaid quote stays legible.
 */
export function ImageDivider({
  src,
  alt,
  quote,
  attribution,
  className,
}: ImageDividerProps) {
  const decorative = !alt && !quote;
  return (
    <div
      role={decorative ? "presentation" : undefined}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "relative w-full overflow-hidden bg-forest-900",
        className
      )}
    >
      <div className="relative h-44 w-full sm:h-56 md:h-72 lg:h-80">
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes="100vw"
          className="object-cover"
        />

        {/* Darkening scrim — flat tint + soft vignette for legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-forest-950/55"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-forest-950/40 via-transparent to-forest-950/50"
        />

        {quote ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-10">
            <div className="max-w-2xl text-center text-cream">
              <p className="font-display text-base leading-snug sm:text-xl md:text-2xl lg:text-3xl">
                <span aria-hidden="true" className="text-tangerine-300">
                  &laquo;{" "}
                </span>
                {quote}
                <span aria-hidden="true" className="text-tangerine-300">
                  {" "}
                  &raquo;
                </span>
              </p>
              {attribution ? (
                <p className="mt-3 font-mono text-2xs uppercase tracking-[0.15em] text-tangerine-300 sm:mt-4 sm:text-xs">
                  {attribution}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
