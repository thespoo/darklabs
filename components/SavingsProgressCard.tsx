// components/SavingsProgressCard.tsx
// Progress toward a deposit target. Maya's hero — it is the thing she is
// actually doing. Daniel carries the same component near-complete.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { gbp, toPercent } from "@/lib/format";
import { Card } from "./ui/Card";
import { Figure, Pill, Progress, Row } from "./ui/primitives";

export const SavingsProgressCardProps = z.object({
  label: z.string(),
  current: z.number(),
  target: z.number(),
  monthlyContribution: z.number(),
  /** Optional context line, e.g. "Based on a 10% deposit on a £280,000 home". */
  targetBasis: z.string().optional(),
});
export type SavingsProgressCardProps = z.input<typeof SavingsProgressCardProps>;

export function SavingsProgressCard({
  label,
  current,
  target,
  monthlyContribution,
  targetBasis,
  prominence = "standard",
}: SavingsProgressCardProps & { prominence?: Prominence }) {
  const percent = toPercent(current, target);
  const shortfall = Math.max(0, target - current);
  const monthsLeft =
    monthlyContribution > 0 ? Math.ceil(shortfall / monthlyContribution) : null;
  const onTrack = shortfall === 0;

  // "14 months" is hard to picture. "August 2027" is not.
  const arrival =
    monthsLeft !== null && monthsLeft > 0
      ? new Date(
          new Date().getFullYear(),
          new Date().getMonth() + monthsLeft,
          1
        ).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      : null;

  return (
    <Card
      prominence={prominence}
      eyebrow="Deposit"
      title={label}
      aside={
        onTrack ? (
          <Pill label="Target reached" tone="positive" />
        ) : (
          <Pill label={`${Math.round(percent)}% saved`} tone="accent" />
        )
      }
    >
      {prominence === "hero" ? (
        <div className="mb-[var(--u-stack)] flex flex-wrap items-end justify-between gap-4">
          <Figure
            label="Saved so far"
            value={gbp(current)}
            sub={`of a ${gbp(target)} target`}
            prominence="hero"
            tone="accent"
          />
          {arrival && (
            <div className="text-right">
              <p className="text-[length:var(--u-text-xs)] font-semibold uppercase tracking-[0.09em] text-[var(--u-ink-faint)]">
                On track for
              </p>
              <p className="u-figure text-[length:var(--u-text-lg)] font-semibold text-[var(--u-ink)]">
                {arrival}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mb-2 text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
          <span className="u-figure font-semibold text-[var(--u-ink)]">
            {gbp(current)}
          </span>{" "}
          of {gbp(target)}
        </p>
      )}

      <Progress
        percent={percent}
        tone={onTrack ? "positive" : "accent"}
        thick={prominence === "hero"}
      />

      {prominence !== "muted" && (
        <div className="mt-[var(--u-stack)] divide-y divide-[var(--u-line)]">
          <Row label="Saving each month" value={gbp(monthlyContribution)} />
          {!onTrack && (
            <Row label="Still to save" value={gbp(shortfall)} emphasis />
          )}
          {monthsLeft !== null && monthsLeft > 0 && (
            <Row
              label="At this rate"
              value={`${monthsLeft} ${monthsLeft === 1 ? "month" : "months"}`}
            />
          )}
        </div>
      )}

      {targetBasis && prominence === "hero" && (
        <p className="mt-[var(--u-stack)] text-[length:var(--u-text-sm)] text-[var(--u-ink-faint)]">
          {targetBasis}
        </p>
      )}
    </Card>
  );
}
