// components/AdviserCard.tsx
// Speak to a mortgage adviser. Promoted when the customer's situation is
// complex enough that a conversation beats another calculator.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { Card } from "./ui/Card";
import { Button } from "./ui/primitives";

export const AdviserCardProps = z.object({
  headline: z.string(),
  availability: z.string(),
  ctaLabel: z.string(),
  /** Optional one-liner about why a conversation would help this customer. */
  body: z.string().optional(),
  adviserName: z.string().optional(),
});
export type AdviserCardProps = z.input<typeof AdviserCardProps>;

export function AdviserCard({
  headline,
  availability,
  ctaLabel,
  body,
  adviserName,
  prominence = "standard",
}: AdviserCardProps & { prominence?: Prominence }) {
  const initials = (adviserName ?? "Unicorn Adviser")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Card prominence={prominence}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        {prominence !== "muted" && (
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--u-accent-soft)] text-[length:var(--u-text-base)] font-semibold text-[var(--u-accent-deep)]"
          >
            {initials}
          </span>
        )}

        <div className="min-w-[12rem] flex-1">
          <h2
            className={`font-semibold tracking-tight text-[var(--u-ink)] ${
              prominence === "hero"
                ? "text-[length:var(--u-text-xl)]"
                : "text-[length:var(--u-text-lg)]"
            }`}
          >
            {headline}
          </h2>
          {body && prominence !== "muted" && (
            <p className="mt-1 max-w-prose text-[length:var(--u-text-sm)] leading-relaxed text-[var(--u-ink-soft)]">
              {body}
            </p>
          )}
          <p className="mt-1.5 flex items-center gap-2 text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-[var(--u-positive)]"
            />
            {availability}
          </p>
        </div>

        <Button
          label={ctaLabel}
          tone={prominence === "hero" ? "primary" : "secondary"}
          size={prominence === "muted" ? "sm" : "md"}
        />
      </div>
    </Card>
  );
}
