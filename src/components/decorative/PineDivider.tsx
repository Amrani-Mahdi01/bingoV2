import * as React from "react";
import { cn } from "@/lib/utils";

interface PineDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stroke colour. Defaults to wood-400. */
  color?: string;
}

/**
 * Section-break ornament — two wood-400 hairlines flanking a small pine motif.
 *
 * Subtle enough to disappear at small sizes; provides a wayfinding rhythm
 * between page sections (homepage, static pages, account pages).
 */
export function PineDivider({
  color = "var(--color-wood-400)",
  className,
  ...props
}: PineDividerProps) {
  return (
    <div
      role="presentation"
      className={cn(
        "my-10 flex w-full items-center gap-4 text-[color:var(--color-wood-400)]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="h-px flex-1"
        style={{ backgroundColor: color }}
      />
      <svg
        aria-hidden="true"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Stylised pine — central trunk with three tapering layers */}
        <path d="M14 5 L9 11 L11.5 11 L7.5 16 L10.75 16 L6 22 L22 22 L17.25 16 L20.5 16 L16.5 11 L19 11 Z" />
        <path d="M14 22 L14 25" />
      </svg>
      <span
        aria-hidden="true"
        className="h-px flex-1"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export default PineDivider;
