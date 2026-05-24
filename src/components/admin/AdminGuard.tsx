"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAdminAuth } from "@/lib/admin-auth";

/**
 * Client-side gate for the admin section.
 *
 * - Wait for the AdminAuthProvider to settle (`loading`).
 * - No admin in context → bounce to `/login` (the shared admin-aware
 *   sign-in page).
 * - Authenticated admin → render the children.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { admin, loading } = useAdminAuth();

  React.useEffect(() => {
    if (loading) return;
    if (!admin) router.replace("/login");
  }, [loading, admin, router]);

  if (loading || !admin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        Vérification de la session…
      </div>
    );
  }

  return <>{children}</>;
}
