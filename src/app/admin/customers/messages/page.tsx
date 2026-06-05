"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  Mail,
  MailOpen,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Mono, Small } from "@/components/ui/typography";
import {
  contactMessagesApi,
  type ApiContactMessage,
} from "@/lib/api/contact-messages";
import { cn } from "@/lib/utils";

/**
 * /admin/customers/messages — inbox for the storefront /contact form.
 * Bot submissions are filtered out upstream by the reCAPTCHA gate in
 * ContactMessageController::store, so everything that lands here is
 * assumed legitimate. Click a row to expand and read the full body;
 * the unread badge in the sidebar should match `meta.unread` returned
 * by GET /api/admin/contact-messages.
 */
export default function MessagesPage() {
  const confirm = useConfirm();
  const [rows, setRows] = React.useState<ApiContactMessage[] | null>(null);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactMessagesApi.list();
      setRows(res.data);
      setUnread(res.meta.unread);
      setError(null);
    } catch {
      setError("Impossible de charger les messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleRead = async (msg: ApiContactMessage, nextRead: boolean) => {
    const prev = rows;
    setRows(
      (curr) =>
        curr?.map((r) =>
          r.id === msg.id
            ? {
                ...r,
                isRead: nextRead,
                readAt: nextRead ? new Date().toISOString() : null,
              }
            : r,
        ) ?? curr,
    );
    setUnread((n) => (nextRead ? Math.max(0, n - 1) : n + 1));
    setBusyId(msg.id);
    try {
      await contactMessagesApi.setRead(msg.id, nextRead);
    } catch (err) {
      setRows(prev ?? null);
      setUnread((n) => (nextRead ? n + 1 : Math.max(0, n - 1)));
      toast.error(
        err instanceof Error ? err.message : "Échec de la mise à jour.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // Mark-as-read fires implicitly when admin expands a message —
  // the natural mental model is "open = I've seen it". Manual
  // toggle is still available via the icon button.
  const onOpen = (msg: ApiContactMessage) => {
    const same = openId === msg.id;
    setOpenId(same ? null : msg.id);
    if (!same && !msg.isRead) void toggleRead(msg, true);
  };

  const remove = async (msg: ApiContactMessage) => {
    const ok = await confirm({
      title: "Supprimer ce message ?",
      message: `Le message de ${msg.name} (${msg.email}) sera supprimé définitivement.`,
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    const prev = rows;
    const wasUnread = !msg.isRead;
    setRows((curr) => curr?.filter((r) => r.id !== msg.id) ?? curr);
    if (wasUnread) setUnread((n) => Math.max(0, n - 1));
    try {
      await contactMessagesApi.remove(msg.id);
      toast.success("Message supprimé.");
    } catch (err) {
      setRows(prev ?? null);
      if (wasUnread) setUnread((n) => n + 1);
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression.",
      );
    }
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Boîte de réception"
        title="Messages"
        subtitle={
          rows === null
            ? "Chargement…"
            : `${rows.length} message${rows.length > 1 ? "s" : ""}${unread > 0 ? ` · ${unread} non lu${unread > 1 ? "s" : ""}` : ""}`
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {rows === null ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          Chargement…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-12 text-center">
          <Mail className="mx-auto size-6 text-zinc-300" strokeWidth={1.6} />
          <p className="mt-2 text-sm font-medium text-zinc-900">
            Aucun message
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Les messages envoyés depuis la page contact apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => (
            <li
              key={m.id}
              className={cn(
                "overflow-hidden rounded-md border bg-white transition-colors",
                m.isRead
                  ? "border-zinc-200"
                  : "border-blue-200 bg-blue-50/40",
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(m)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-zinc-50/60 md:gap-3 md:px-4 md:py-3"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full md:size-8",
                    m.isRead
                      ? "bg-zinc-100 text-zinc-500"
                      : "bg-blue-100 text-blue-700",
                  )}
                >
                  {m.isRead ? (
                    <MailOpen className="size-3 md:size-3.5" strokeWidth={1.8} />
                  ) : (
                    <Mail className="size-3 md:size-3.5" strokeWidth={1.8} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p
                      className={cn(
                        "text-xs md:text-sm",
                        m.isRead
                          ? "font-medium text-zinc-700"
                          : "font-semibold text-zinc-900",
                      )}
                    >
                      {m.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-zinc-500 md:text-2xs">
                      {m.email}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 line-clamp-1 text-xs md:text-sm",
                      m.isRead ? "text-zinc-700" : "text-zinc-900",
                    )}
                  >
                    {m.subject}
                  </p>
                  {openId !== m.id ? (
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-500 md:text-2xs">
                      {m.message}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-zinc-500 md:text-2xs">
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleString("fr-DZ", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </button>

              {/* Expanded body */}
              {openId === m.id ? (
                <div className="border-t border-zinc-100 px-4 py-3">
                  <Mono className="text-2xs text-zinc-500">Message</Mono>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                    {m.message}
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Meta label="Envoyé le">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleString("fr-DZ", {
                            dateStyle: "long",
                            timeStyle: "short",
                          })
                        : "—"}
                    </Meta>
                    <Meta label="IP" dir="ltr">
                      {m.ip ?? (
                        <Small className="text-zinc-400 italic">—</Small>
                      )}
                    </Meta>
                    <Meta label="Statut">
                      {m.isRead && m.readAt ? (
                        <span className="text-emerald-700">
                          Lu le{" "}
                          {new Date(m.readAt).toLocaleString("fr-DZ", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="font-semibold text-blue-700">
                          Non lu
                        </span>
                      )}
                    </Meta>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === m.id}
                      onClick={() => void toggleRead(m, !m.isRead)}
                    >
                      {m.isRead ? (
                        <>
                          <Mail className="size-3.5" />
                          Marquer non lu
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          Marquer lu
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void remove(m)}
                      className="ms-auto border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Meta({
  label,
  dir,
  children,
}: {
  label: string;
  dir?: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  return (
    <div>
      <Mono className="text-2xs uppercase tracking-wide text-zinc-500">
        {label}
      </Mono>
      <p
        className="mt-0.5 text-xs text-zinc-700"
        {...(dir ? { dir } : null)}
      >
        {children}
      </p>
    </div>
  );
}
