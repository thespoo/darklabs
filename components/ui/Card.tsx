// components/ui/Card.tsx
// The chrome every component sits in. Prominence lives here rather than being
// re-implemented ten times: hero is larger and louder, muted is quieter and
// smaller, standard is the baseline card.

import type { ReactNode } from "react";
import type { Prominence } from "@/lib/contract";

export type CardProps = {
  prominence?: Prominence;
  eyebrow?: string;
  title?: string;
  /** Sits to the right of the title — a status pill, a date, a small figure. */
  aside?: ReactNode;
  children: ReactNode;
  /** Rendered under a divider at the bottom of the card. */
  footer?: ReactNode;
};

const shell: Record<Prominence, string> = {
  hero:
    "bg-[var(--u-surface)] border-2 border-[var(--u-accent-line)] shadow-[0_2px_24px_-8px_rgba(15,95,107,0.35)] p-[var(--u-pad-hero)]",
  standard:
    "bg-[var(--u-surface)] border border-[var(--u-line)] shadow-[0_1px_2px_rgba(20,22,26,0.04)] p-[var(--u-pad)]",
  muted:
    "bg-[var(--u-surface-sunken)] border border-[var(--u-line)] p-[var(--u-pad-muted)]",
};

const titleSize: Record<Prominence, string> = {
  hero: "text-[length:var(--u-text-xl)] font-semibold tracking-tight",
  standard: "text-[length:var(--u-text-lg)] font-semibold tracking-tight",
  muted: "text-[length:var(--u-text-base)] font-semibold tracking-tight",
};

const bodyTone: Record<Prominence, string> = {
  hero: "text-[var(--u-ink)]",
  standard: "text-[var(--u-ink)]",
  muted: "text-[var(--u-ink-soft)]",
};

export function Card({
  prominence = "standard",
  eyebrow,
  title,
  aside,
  children,
  footer,
}: CardProps) {
  return (
    <section
      data-prominence={prominence}
      className={`relative flex h-full flex-col rounded-[var(--u-radius)] ${shell[prominence]} ${bodyTone[prominence]}`}
    >
      {prominence === "hero" && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 rounded-t-[var(--u-radius)] bg-[var(--u-accent)]"
        />
      )}

      {(eyebrow || title || aside) && (
        <header className="mb-[var(--u-stack)] flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[length:var(--u-text-xs)] font-semibold uppercase tracking-[0.09em] text-[var(--u-ink-faint)]">
                {eyebrow}
              </p>
            )}
            {title && <h2 className={titleSize[prominence]}>{title}</h2>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </header>
      )}

      <div className="flex-1">{children}</div>

      {footer && (
        <footer className="mt-[var(--u-stack)] border-t border-[var(--u-line)] pt-[var(--u-stack)]">
          {footer}
        </footer>
      )}
    </section>
  );
}
