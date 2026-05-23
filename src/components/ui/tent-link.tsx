"use client";

import * as React from "react";
import Link, { type LinkProps } from "next/link";

type TentLinkProps = LinkProps & {
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
};

/**
 * Drop-in replacement for next/link that triggers the global tent
 * transition overlay before navigating. Falls back to a normal
 * navigation if the user is using a modifier key (Ctrl/Cmd-click,
 * right-click, etc.) so opening in a new tab still works.
 */
export function TentLink({
  href,
  onClick,
  children,
  className,
  ...props
}: TentLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      // Let the browser handle "open in new tab" etc.
      return;
    }

    // If <TentOverlay /> isn't mounted, there's nothing to listen for
    // our custom event. Fall back to Next.js Link's default behavior
    // so navigation still works.
    if (
      typeof window === "undefined" ||
      !(window as { __bingoTentActive?: boolean }).__bingoTentActive
    ) {
      return;
    }

    event.preventDefault();
    const target =
      typeof href === "string"
        ? href
        : (href.pathname ?? "/") +
          (href.search ? `?${href.search}` : "") +
          (href.hash ? `#${href.hash}` : "");

    window.dispatchEvent(
      new CustomEvent("tent-navigate", { detail: { href: target } })
    );
  };

  return (
    <Link href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </Link>
  );
}
