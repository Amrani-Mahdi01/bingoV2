import * as React from "react";
import { Construction } from "lucide-react";

import { Small } from "@/components/ui/typography";

/**
 * Reusable "coming soon" panel for admin pages whose Laravel endpoints
 * haven't been built yet. Replaces the previous mock-data UIs so the
 * dashboard never lies about what's there.
 */
export function AdminPlaceholder({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <Construction className="size-5" />
      </div>
      <h3 className="mt-4 font-sans text-sm font-semibold text-zinc-900">
        {title}
      </h3>
      {description ? (
        <Small className="mx-auto mt-1.5 block max-w-md text-zinc-500">
          {description}
        </Small>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
