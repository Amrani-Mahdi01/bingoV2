import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  /** Right-side slot — CTAs, filters etc. */
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-5",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-[1.375rem] font-semibold leading-tight tracking-tight text-zinc-900">
          {title}
        </h1>
        {subtitle ? (
          <div className="mt-1.5 text-sm text-zinc-500">{subtitle}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
