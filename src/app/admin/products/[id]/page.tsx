"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";
import { Mono } from "@/components/ui/typography";
import { HttpError } from "@/lib/api/http";
import { productsApi, type ApiProduct } from "@/lib/api/products";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = React.useState<ApiProduct | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "notfound" | "error">(
    "loading",
  );

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setStatus("loading");
    productsApi
      .get(id)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof HttpError && err.status === 404) {
          setStatus("notfound");
        } else {
          console.error("[admin/products/{id}] load failed", err);
          toast.error("Impossible de charger le produit");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Produit introuvable"
          subtitle={`Aucun produit avec l'identifiant ${id}.`}
        />
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Retour aux produits
        </button>
      </div>
    );
  }

  if (status === "error" || !product) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erreur de chargement. Vérifiez votre session ou réessayez.
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title={product.nameFr}
        subtitle={`SKU ${product.sku}`}
        actions={
          <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-1.5">
            <span className="relative size-9 overflow-hidden rounded-md bg-white">
              <Image
                src={product.images[0]?.url ?? "/api/placeholder/80/80"}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            </span>
            <Mono className="text-zinc-700">{product.stock} en stock</Mono>
          </div>
        }
      />
      <ProductCreateForm initialProduct={product} />
    </>
  );
}
