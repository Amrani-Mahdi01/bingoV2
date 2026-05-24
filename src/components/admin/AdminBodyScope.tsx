"use client";

import * as React from "react";

interface AdminBodyScopeProps {
  /**
   * Classnames whose definitions carry CSS variables that need to apply to
   * portal-rendered elements (e.g. Next/font/google `*.variable` strings).
   */
  fontClasses?: string[];
}

/**
 * Mirrors the `data-admin` attribute and Geist font variables onto `<body>`
 * while the admin layout is mounted. Radix portals (Select, DropdownMenu,
 * Popover) render outside the admin layout's div, so any [data-admin] CSS
 * variable overrides or font-variable definitions only on the div don't
 * reach them. Promoting them to body makes portals inherit the same zinc
 * palette and typography as the rest of the admin tree.
 */
export function AdminBodyScope({ fontClasses = [] }: AdminBodyScopeProps) {
  React.useEffect(() => {
    document.body.dataset.admin = "";
    const added = fontClasses.filter(Boolean);
    added.forEach((c) => document.body.classList.add(c));
    return () => {
      delete document.body.dataset.admin;
      added.forEach((c) => document.body.classList.remove(c));
    };
  }, [fontClasses]);
  return null;
}
