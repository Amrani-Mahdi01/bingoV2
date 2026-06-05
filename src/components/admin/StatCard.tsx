import * as React from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  /** Optional change indicator — positive = emerald, negative = red. */
  change?: number;
  /** Optional one-line subtitle (e.g. "Sur les 30 derniers jours"). */
  subtitle?: string;
  icon: LucideIcon;
  /** Children render below value (e.g. a sparkline). */
  children?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  subtitle,
  icon: Icon,
  children,
  className,
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-md border border-zinc-200 bg-white p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-zinc-500 sm:text-xs">
          {label}
        </p>
        <Icon className="size-4 text-zinc-400" strokeWidth={1.75} />
      </div>
      <div className="mt-2 flex items-baseline gap-2 sm:mt-3">
        <p className="text-xl font-semibold leading-none tracking-tight tabular-nums text-zinc-900 sm:text-3xl">
          {value}
        </p>
        {typeof change === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums sm:text-xs",
              isPositive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(change * 100).toFixed(1)}%
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-1 text-[11px] text-zinc-500 sm:mt-1.5 sm:text-xs">
          {subtitle}
        </p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
