// components/MortgageSummary.tsx
// Priya's current mortgage. Neither of the other two personas can have this
// component, because neither of them holds a mortgage with us — which is the
// most defensible personalisation story in the room.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { gbp, gbpExact, monthYear, pct } from "@/lib/format";
import { Card } from "./ui/Card";
import { Figure, Pill, Row } from "./ui/primitives";

export const MortgageSummaryProps = z.object({
  balance: z.number(),
  rate: z.number(),
  /** Months remaining on the term. */
  termRemaining: z.number(),
  /** ISO date the current deal ends. */
  dealEnds: z.string(),
  portable: z.boolean(),
  productName: z.string().optional(),
  monthlyPayment: z.number().optional(),
  accountNumber: z.string().optional(),
});
export type MortgageSummaryProps = z.input<typeof MortgageSummaryProps>;

function formatTerm(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} months`;
  if (rest === 0) return `${years} years`;
  return `${years} yrs ${rest} mths`;
}

/** Months until the deal ends — a deal ending soon is worth flagging. */
function monthsUntil(iso: string): number | null {
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  return (
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth())
  );
}

export function MortgageSummary({
  balance,
  rate,
  termRemaining,
  dealEnds,
  portable,
  productName,
  monthlyPayment,
  accountNumber,
  prominence = "standard",
}: MortgageSummaryProps & { prominence?: Prominence }) {
  const until = monthsUntil(dealEnds);
  const dealEndingSoon = until !== null && until <= 12 && until >= 0;

  return (
    <Card
      prominence={prominence}
      eyebrow="Your Unicorn mortgage"
      title={productName ?? "Residential mortgage"}
      aside={
        portable ? (
          <Pill label="Portable" tone="positive" />
        ) : (
          <Pill label="Not portable" tone="neutral" />
        )
      }
    >
      {prominence === "hero" ? (
        <div className="mb-[var(--u-stack)] grid gap-[var(--u-gap)] sm:grid-cols-3">
          <Figure
            label="Balance outstanding"
            value={gbp(balance)}
            prominence="hero"
            tone="accent"
          />
          <Figure label="Interest rate" value={pct(rate)} prominence="standard" />
          <Figure
            label="Term remaining"
            value={formatTerm(termRemaining)}
            prominence="standard"
          />
        </div>
      ) : (
        <div className="divide-y divide-[var(--u-line)]">
          <Row label="Balance outstanding" value={gbp(balance)} emphasis />
          <Row label="Interest rate" value={pct(rate)} />
          <Row label="Term remaining" value={formatTerm(termRemaining)} />
        </div>
      )}

      {prominence !== "muted" && (
        <div className="divide-y divide-[var(--u-line)]">
          {monthlyPayment !== undefined && (
            <Row label="Monthly payment" value={gbpExact(monthlyPayment)} />
          )}
          <Row
            label="Current deal ends"
            value={
              <span className="inline-flex items-center gap-2">
                {monthYear(dealEnds)}
                {dealEndingSoon && <Pill label="Soon" tone="caution" />}
              </span>
            }
          />
          {accountNumber && (
            <Row label="Account" value={accountNumber} />
          )}
        </div>
      )}

      {portable && prominence !== "muted" && (
        <p className="mt-[var(--u-stack)] rounded-lg bg-[var(--u-positive-soft)] px-3 py-2 text-[length:var(--u-text-sm)] text-[var(--u-positive)]">
          This mortgage can move with you, so you may be able to keep your
          current rate on a new home.
        </p>
      )}
    </Card>
  );
}
