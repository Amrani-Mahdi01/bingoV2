"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BackupManager } from "@/components/admin/BackupManager";
import { LogoManager } from "@/components/admin/LogoManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Body } from "@/components/ui/typography";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const onSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Configuration enregistrée");
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Paramètres du site"
        subtitle="Informations du site et coordonnées."
      />

      {/* Logo — wired to /api/admin/settings + /api/admin/uploads/logo */}
      <div className="mb-6">
        <LogoManager />
      </div>

      {/* Database backup & restore — server-side snapshots via /api/admin/backups */}
      <div className="mb-6">
        <BackupManager />
      </div>

      <form onSubmit={onSave} className="space-y-6 pb-32">
        {/* 1. Site */}
        <Section title="Informations du site" id="site">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="site-name-fr" label="Nom du site (FR)">
              <Input id="site-name-fr" defaultValue="BINGO" />
            </Field>
            <Field id="site-name-ar" label="اسم الموقع (AR)">
              <Input
                id="site-name-ar"
                defaultValue="بينغو"
                dir="rtl"
                lang="ar"
              />
            </Field>
            <Field id="site-slogan-fr" label="Slogan (FR)">
              <Input
                id="site-slogan-fr"
                defaultValue="L'aventure commence ici"
              />
            </Field>
            <Field id="site-slogan-ar" label="الشعار (AR)">
              <Input
                id="site-slogan-ar"
                defaultValue="المغامرة تبدأ من هنا"
                dir="rtl"
                lang="ar"
              />
            </Field>
            <Field id="site-desc-fr" label="Description SEO (FR)">
              <Textarea
                id="site-desc-fr"
                rows={3}
                defaultValue="BINGO — sélection rigoureuse d'équipement outdoor en Algérie. Livraison ZR Express dans toutes les wilayas."
              />
            </Field>
            <Field id="site-desc-ar" label="وصف السيو (AR)">
              <Textarea
                id="site-desc-ar"
                rows={3}
                defaultValue="بينغو — تشكيلة مختارة بعناية من معدات الأنشطة الخارجية في الجزائر. توصيل ZR Express لجميع الولايات."
                dir="rtl"
                lang="ar"
              />
            </Field>
            <Field id="site-lang" label="Langue par défaut">
              <Select defaultValue="fr">
                <SelectTrigger id="site-lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="site-currency" label="Devise">
              <Input id="site-currency" defaultValue="DZD" readOnly className="font-mono" />
            </Field>
          </div>
        </Section>

        {/* Coordonnées & réseaux sociaux — moved to their own page. */}
        <Section title="Coordonnées & réseaux" id="contact-pointer">
          <Body className="text-sm text-zinc-600">
            Le téléphone, l&apos;email, WhatsApp, l&apos;adresse, les horaires
            et les liens sociaux sont gérés sur une page dédiée.
          </Body>
          <Link
            href={routes.admin.contacts}
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Ouvrir « Coordonnées & réseaux » →
          </Link>
        </Section>

        {/* Sticky save */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
            <Button type="submit" variant="primary" size="default">
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-md border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
      <h2 className="font-sans text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

