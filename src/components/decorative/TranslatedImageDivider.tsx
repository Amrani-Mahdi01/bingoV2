"use client";

import * as React from "react";

import { ImageDivider } from "@/components/decorative/ImageDivider";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

interface TranslatedImageDividerProps {
  src: string;
  quote: TranslationKey;
  attribution?: TranslationKey;
  className?: string;
}

/** Locale-aware image divider — looks up its quote/attribution from the dictionary. */
export function TranslatedImageDivider({
  src,
  quote,
  attribution,
  className,
}: TranslatedImageDividerProps) {
  const t = useT();
  return (
    <ImageDivider
      src={src}
      quote={t(quote)}
      attribution={attribution ? t(attribution) : undefined}
      className={className}
    />
  );
}
