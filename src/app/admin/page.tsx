"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Image as ImageIcon,
  ShoppingBag,
  Tag,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardKpis } from "@/components/admin/DashboardKpis";
import { Small } from "@/components/ui/typography";
import { bannersApi } from "@/lib/api/banners";
import { brandsApi } from "@/lib/api/brands";
import { categoriesApi } from "@/lib/api/categories";
import { HttpError } from "@/lib/api/http";
import { productsApi } from "@/lib/api/products";
import { statsApi, type DashboardStats } from "@/lib/api/stats";
import { cn } from "@/lib/utils";

interface Counts {
  products: number;
  categories: number;
  brands: number;
  banners: number;
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = React.useState<Counts | null>(null);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      productsApi.listAll({ perPage: 1 }),
      categoriesApi.listAll(),
      brandsApi.listAll(),
      bannersApi.listAll(),
      statsApi.dashboard(),
    ])
      .then(([prods, cats, brands, banners, dash]) => {
        const catTotal = cats.reduce(
          (acc, c) => acc + 1 + (c.children?.length ?? 0),
          0,
        );
        setCounts({
          products: prods.meta.total,
          categories: catTotal,
          brands: brands.length,
          banners: banners.length,
        });
        setStats(dash);
      })
      .catch((err) => {
        if (err instanceof HttpError && err.status === 401) {
          setError("Session expirée. Reconnectez-vous.");
        } else {
          console.error(err);
          setError("Impossible de charger les chiffres.");
        }
      });
  }, []);

  return (
    <>
      <AdminPageHeader
        eyebrow="Vue d'ensemble"
        title="Tableau de bord"
        subtitle="Contenu publié sur la boutique. Les ventes et statistiques arrivent avec le module commandes."
      />

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CountCard
          label="Produits"
          value={counts?.products}
          icon={ShoppingBag}
          href="/admin/products"
          tone="emerald"
        />
        <CountCard
          label="Catégories"
          value={counts?.categories}
          icon={Boxes}
          href="/admin/categories"
          tone="blue"
        />
        <CountCard
          label="Marques"
          value={counts?.brands}
          icon={Tag}
          href="/admin/products?focus=brands"
          tone="amber"
        />
        <CountCard
          label="Bannières"
          value={counts?.banners}
          icon={ImageIcon}
          href="/admin/banners"
          tone="violet"
        />
      </div>

      {stats ? (
        <div className="mt-8">
          <DashboardKpis stats={stats} />
        </div>
      ) : (
        <p className="mt-8 text-xs text-zinc-500">Chargement des statistiques…</p>
      )}
    </>
  );
}

function CountCard({
  label,
  value,
  icon: Icon,
  href,
  tone,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  href: string;
  tone: "emerald" | "blue" | "amber" | "violet";
}) {
  const palette: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <Link
      href={href}
      className="group block rounded-md border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-md",
            palette[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
        <ArrowRight className="size-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600" />
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-zinc-900">
        {value === undefined ? "…" : value}
      </p>
      <Small className="text-zinc-500">{label}</Small>
    </Link>
  );
}
