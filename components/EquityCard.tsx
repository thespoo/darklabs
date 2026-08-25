// components/EquityCard.tsx
// Estimated equity and what it could unlock. Reads a property value and a
// mortgage balance and shows the gap between them as something usable.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { gbp } from "@/lib/format";
import { Card } from "./ui/Card";
import { Button, Figure, Row } from "./ui/primitives";

export const EquityCardProps = z.object({
  propertyValue: z.number(),
  mortgageBalance: z.number(),
  estimatedEquity: z.number(),
  additionalBorrowing: z.number().optional(),
  valuationBasis: z.string().optional(),
  ctaLabel: z.string().optional(),
});
export type EquityCardProps = z.input<typeof EquityCardProps>;

export function EquityCard({
  propertyValue,
  mortgageBalance,
  estimatedEquity,
  additionalBorrowing,
  valuationBasis,
  ctaLabel,
  prominence = "standard",
}: EquityCardProps & { prominence?: Prominence }) {
  const equityShare =
    propertyValue > 0
      ? Math.max(0, Math.min(100, (estimatedEquity / propertyValue) * 100))
      : 0;

  return (
    <Card
      prominence={prominence}
      eyebrow="Your home"
      title="Equity and borrowing"
      footer={
        ctaLabel && prominence !== "muted" ? (
          <Button
            label={ctaLabel}
            tone={prominence === "hero" ? "primary" : "secondary"}
          />
        ) : undefined
      }
    >
      <Figure
        label="Estimated equity"
        value={gbp(estimatedEquity)}
        sub={`${Math.round(equityShare)}% of your home's value`}
        prominence={prominence}
        tone="accent"
      />

      {/* The split bar makes equity legible without reading a single number. */}
      {prominence !== "muted" && (
        <div className="mt-[var(--u-stack)]">
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-[var(--u-line)]">
            <div
              className="h-full bg-[var(--u-accent)]"
              style={{ width: `${equityShare}%` }}
            />
            <div className="h-full flex-1 bg-[var(--u-line)]" />
          </div>
          <div className="mt-1.5 flex justify-between text-[length:var(--u-text-xs)] font-medium">
            <span className="text-[var(--u-accent-deep)]">
              Yours · {gbp(estimatedEquity)}
            </span>
            <span className="text-[var(--u-ink-faint)]">
              Outstanding · {gbp(mortgageBalance)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-[var(--u-stack)] divide-y divide-[var(--u-line)]">
        <Row label="Estimated property value" value={gbp(propertyValue)} />
        <Row label="Mortgage balance" value={gbp(mortgageBalance)} />
        {additionalBorrowing !== undefined && (
          <Row
            label="You could borrow up to a further"
            value={gbp(additionalBorrowing)}
            emphasis
          />
        )}
      </div>

      {valuationBasis && prominence !== "muted" && (
        <p className="mt-[var(--u-stack)] text-[length:var(--u-text-xs)] text-[var(--u-ink-faint)]">
          {valuationBasis}
        </p>
      )}
    </Card>
  );
}
