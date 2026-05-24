import * as React from "react";
import { cn } from "@/lib/utils";

type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, "as" | "className" | "children">;

/* -----------------------------------------------------------
   Display headings — Fraunces (font-display)
   Scale: 12/14/16/18/20/24/32/40/56/72
   Display line-height 1.15, tracking -0.02em at 40px+
   ----------------------------------------------------------- */

export function H1<E extends React.ElementType = "h1">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "h1") as React.ElementType;
  return (
    <Comp
      className={cn(
        "font-display text-3xl leading-[1.05] tracking-[-0.02em] text-ink",
        // 56px desktop, 40px tablet, 32px mobile
        "max-md:text-2xl max-sm:text-xl",
        className
      )}
      {...props}
    />
  );
}

export function H2<E extends React.ElementType = "h2">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "h2") as React.ElementType;
  return (
    <Comp
      className={cn(
        "font-display text-2xl leading-[1.1] tracking-[-0.02em] text-ink",
        "max-md:text-xl max-sm:text-lg",
        className
      )}
      {...props}
    />
  );
}

export function H3<E extends React.ElementType = "h3">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "h3") as React.ElementType;
  return (
    <Comp
      className={cn(
        "font-display text-xl leading-[1.15] text-ink",
        "max-sm:text-lg",
        className
      )}
      {...props}
    />
  );
}

export function H4<E extends React.ElementType = "h4">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "h4") as React.ElementType;
  return (
    <Comp
      className={cn(
        "font-body text-md leading-[1.2] font-semibold text-ink",
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------
   Body components — Inter (font-body)
   Body line-height 1.6
   ----------------------------------------------------------- */

export function Lead<E extends React.ElementType = "p">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "p") as React.ElementType;
  return (
    <Comp
      className={cn(
        "font-body text-md leading-[1.6] text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function Body<E extends React.ElementType = "p">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "p") as React.ElementType;
  return (
    <Comp
      className={cn("font-body text-sm leading-[1.6] text-ink", className)}
      {...props}
    />
  );
}

export function Small<E extends React.ElementType = "span">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "span") as React.ElementType;
  return (
    <Comp
      className={cn(
        "font-body text-xs leading-[1.55] text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function Mono<E extends React.ElementType = "span">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp = (as ?? "span") as React.ElementType;
  return (
    <Comp
      className={cn(
        "font-mono text-xs tracking-tight uppercase text-wood-700",
        className
      )}
      {...props}
    />
  );
}
