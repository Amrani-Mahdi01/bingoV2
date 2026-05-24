"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Delay in ms before the animation fires (useful for staggered children). */
  delay?: number;
  /** Tag to render. Defaults to a div. */
  as?: "div" | "section" | "article" | "ul" | "li";
  className?: string;
}

/**
 * Reveals its children with a soft fade + slide-up the first time it
 * enters the viewport. Once revealed it stays revealed — no repeating.
 * Respects prefers-reduced-motion and SSR.
 */
export function ScrollReveal({
  children,
  delay = 0,
  as = "div",
  className,
}: ScrollRevealProps) {
  const Tag = as;
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Reduced motion — show immediately, no animation
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const el = ref.current;
    if (!el) return;

    // If the element is already in view on mount (above the fold), fire
    // the animation right away so first-paint content doesn't sit hidden.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error — ref is typed against HTMLElement which is fine
      // for the union of supported tags above
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition duration-700 ease-out motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0",
        className
      )}
    >
      {children}
    </Tag>
  );
}
