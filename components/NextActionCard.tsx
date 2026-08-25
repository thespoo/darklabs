// components/NextActionCard.tsx
// The single most important thing to do next. Gold changes which slot holds
// this and how loudly it speaks, rarely the copy itself.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { Card } from "./ui/Card";
import { Button } from "./ui/primitives";

export const NextActionCardProps = z.object({
  headline: z.string(),
  body: z.string(),
  ctaLabel: z.string(),
  emphasis: z.enum(["high", "normal", "low"]).default("normal"),
  /** Optional supporting line, e.g. "Takes about 10 minutes". */
  note: z.string().optional(),
});
export type NextActionCardProps = z.input<typeof NextActionCardProps>;

export function NextActionCard({
  headline,
  body,
  ctaLabel,
  emphasis = "normal",
  note,
  prominence = "standard",
}: NextActionCardProps & { prominence?: Prominence }) {
  // A high-emphasis action at hero prominence takes over the card entirely:
  // accent field, reversed text. Everything else stays inside normal chrome.
  const takeover = emphasis === "high" && prominence === "hero";

  if (takeover) {
    return (
      <section
        data-prominence={prominence}
        className="flex h-full flex-col justify-between gap-5 rounded-[var(--u-radius)] bg-[var(--u-accent)] p-[var(--u-pad-hero)] text-[var(--u-accent-on)] shadow-[0_2px_24px_-8px_rgba(15,95,107,0.55)] sm:flex-row sm:items-center"
      >
        <div className="min-w-0">
          <p className="mb-1 text-[length:var(--u-text-xs)] font-semibold uppercase tracking-[0.09em] opacity-75">
            Your next step
          </p>
          <h2 className="text-[length:var(--u-text-2xl)] font-semibold tracking-tight">
            {headline}
          </h2>
          <p className="mt-1.5 max-w-prose text-[length:var(--u-text-base)] leading-relaxed opacity-90">
            {body}
          </p>
          {note && (
            <p className="mt-2 text-[length:var(--u-text-sm)] opacity-75">
              {note}
            </p>
          )}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full bg-[var(--u-accent-on)] px-6 py-3 text-[length:var(--u-text-base)] font-semibold text-[var(--u-accent-deep)] transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </button>
      </section>
    );
  }

  return (
    <Card
      prominence={prominence}
      eyebrow="Your next step"
      title={headline}
      footer={
        <div className="flex items-center justify-between gap-4">
          <Button
            label={ctaLabel}
            tone={emphasis === "low" ? "quiet" : emphasis === "high" ? "primary" : "secondary"}
            size={prominence === "muted" ? "sm" : "md"}
          />
          {note && (
            <span className="text-[length:var(--u-text-xs)] text-[var(--u-ink-faint)]">
              {note}
            </span>
          )}
        </div>
      }
    >
      <p className="max-w-prose text-[length:var(--u-text-base)] leading-relaxed text-[var(--u-ink-soft)]">
        {body}
      </p>
    </Card>
  );
}
