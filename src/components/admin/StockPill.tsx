import * as React from "react";
import { Check, Clock, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StockStatus } from "@/lib/types";

interface StockPillProps {
  status: StockStatus;
  compact?: boolean;
  className?: string;
}

/**
 * Admin-only stock indicator. Decoupled from the storefront's
 * `StockBadge` because the admin layout doesn't mount a
 * `LanguageProvider` (the dashboard is FR-only for now) — so it can't
 * call `useT()`. Hardcoded French strings.
 */
const META: Record<
  StockStatus,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  in_stock: {
    label: "En stock",
    icon: <Check className="size-3" />,
    cls: "bg-emerald-50 text-emerald-700",
  },
  low_stock: {
    label: "Stock faible",
    icon: <Clock className="size-3" />,
    cls: "bg-amber-50 text-amber-700",
  },
  out_of_stock: {
    label: "Rupture",
    icon: <TriangleAlert className="size-3" />,
    cls: "bg-red-50 text-red-700",
  },
};

export function StockPill({ status, compact = false, className }: StockPillProps) {
  const c = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium uppercase tracking-wide",
        c.cls,
        compact && "px-1.5",
        className,
      )}
    >
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
}
