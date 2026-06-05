import * as React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AdminBodyScope } from "@/components/admin/AdminBodyScope";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminMobileNavProvider } from "@/components/admin/AdminMobileNavContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmProvider } from "@/components/admin/ConfirmDialog";
import { DragDropTouchPolyfill } from "@/components/admin/DragDropTouchPolyfill";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

// Admin-only fonts. The CSS variables are picked up inside the
// `[data-admin]` scope (see globals.css) so admin headings + body
// switch to Geist while the storefront keeps its own typography.
const geistSans = Geist({
  variable: "--admin-font-sans",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--admin-font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Administration — BINGO",
    template: "%s — Admin BINGO",
  },
  description: "Backoffice BINGO — gestion produits, commandes et clients.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <ConfirmProvider>
        <AdminMobileNavProvider>
          <div
            data-admin
            className={cn(
              "flex min-h-screen w-full bg-zinc-50 text-zinc-900",
              geistSans.variable,
              geistMono.variable
            )}
          >
            <AdminBodyScope
              fontClasses={[geistSans.variable, geistMono.variable]}
            />
            <DragDropTouchPolyfill />
            <AdminSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AdminTopbar />
              <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
                {children}
              </main>
            </div>
            <Toaster />
          </div>
        </AdminMobileNavProvider>
      </ConfirmProvider>
    </AdminGuard>
  );
}
