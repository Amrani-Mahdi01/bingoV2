"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Imperative confirmation dialog for the admin section.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: "Supprimer ce produit ?",
 *     message: "Cette action est irréversible.",
 *     variant: "destructive",
 *     confirmLabel: "Supprimer",
 *   });
 *   if (!ok) return;
 *
 * Mount `<ConfirmProvider>` once near the root of the admin tree; the hook
 * resolves to a boolean (true = confirmed, false = cancelled).
 */

export interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);

interface PendingRequest {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<PendingRequest | null>(null);

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const resolveAndClose = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  const value = React.useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) resolveAndClose(false);
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,28rem)] max-w-none sm:max-w-none">
          {pending ? (
            <ConfirmBody
              options={pending.options}
              onCancel={() => resolveAndClose(false)}
              onConfirm={() => resolveAndClose(true)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

function ConfirmBody({
  options,
  onCancel,
  onConfirm,
}: {
  options: ConfirmOptions;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const destructive = options.variant === "destructive";
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  // Auto-focus the cancel button by default so the destructive action
  // never wins on a stray Enter press. The user has to move focus to
  // confirm explicitly.
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Allow ⌘/Ctrl + Enter to confirm from anywhere inside the dialog.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        confirmRef.current?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
              destructive
                ? "bg-red-100 text-red-700"
                : "bg-zinc-100 text-zinc-700"
            )}
            aria-hidden="true"
          >
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold text-zinc-900">
              {options.title}
            </DialogTitle>
            {options.message ? (
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                {options.message}
              </p>
            ) : null}
          </div>
        </div>
      </DialogHeader>
      <DialogFooter>
        <Button
          ref={cancelRef}
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          {options.cancelLabel ?? "Annuler"}
        </Button>
        <Button
          ref={confirmRef}
          type="button"
          variant={destructive ? "primary" : "primary"}
          size="sm"
          onClick={onConfirm}
          className={cn(
            destructive &&
              "!bg-red-600 hover:!bg-red-700 focus-visible:!ring-red-300"
          )}
        >
          {options.confirmLabel ?? "Confirmer"}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Returns the imperative `confirm(options)` function. Must be called from
 * a tree that's wrapped in `<ConfirmProvider>` (the admin layout is).
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm() must be used inside <ConfirmProvider>.");
  }
  return ctx.confirm;
}
