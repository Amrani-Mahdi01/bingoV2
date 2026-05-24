"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Body, H1, Mono, Small } from "@/components/ui/typography";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl rounded-md border border-zinc-200 bg-zinc-50 p-8 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <TriangleAlert className="size-6" />
      </span>
      <Mono className="mt-4 text-zinc-500">Erreur backoffice</Mono>
      <H1 className="mt-2 text-xl">Une opération a échoué</H1>
      <Body className="mt-3 text-zinc-500">
        L&apos;équipe technique a été notifiée. Réessayez l&apos;action, ou
        rechargez la page si l&apos;erreur persiste.
      </Body>
      {error.digest ? (
        <Small className="mt-3 block font-mono">
          Référence : {error.digest}
        </Small>
      ) : null}
      <div className="mt-6 flex justify-center gap-3">
        <Button type="button" variant="primary" onClick={reset}>
          Réessayer
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Recharger
        </Button>
      </div>
    </div>
  );
}
