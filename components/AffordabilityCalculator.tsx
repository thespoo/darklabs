"use client";

// components/AffordabilityCalculator.tsx
// The one component that proves the server drives *behaviour*, not just
// visibility. Three modes, three different jobs:
//
//   explore — you don't know where to start. Open-ended, sliders, a range.
//   confirm — you have a figure. Here it is, and here is the monthly cost.
//   moving  — you already own. Equity in, new borrowing out.
//
// It is still presentational: every number it needs arrives as a prop, and it
// knows nothing about who is looking at it.

import { useState } from "react";
import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { gbp, gbpExact, monthlyPayment } from "@/lib/format";
import { Card } from "./ui/Card";
import { Button, Figure, Pill, Row, Slider } from "./ui/primitives";

export const AffordabilityCalculatorProps = z.object({
  mode: z.enum(["explore", "confirm", "moving"]),
  income: z.number().optional(),
  deposit: z.number().optional(),
  maxBorrowing: z.number().optional(),
  monthlyIllustration: z.number().optional(),
  /** Moving mode only — the existing position. */
  propertyValue: z.number().optional(),
  mortgageBalance: z.number().optional(),
  /** Illustrative product rate and term. */
  rate: z.number().optional(),
  termYears: z.number().optional(),
  /** Confirm mode — when the figure was worked out. */
  calculatedOn: z.string().optional(),
});
export type AffordabilityCalculatorProps = z.input<typeof AffordabilityCalculatorProps>;

/** Not real affordability logic — a plausible multiple, per the spec's scope. */
const MULTIPLE = { low: 4.0, mid: 4.5, high: 4.75 };

const eyebrow = {
  explore: "Affordability",
  confirm: "Your borrowing",
  moving: "Moving home",
} as const;

const heading = {
  explore: "What could you afford?",
  confirm: "What you could borrow",
  moving: "Could you afford to move?",
} as const;

export function AffordabilityCalculator(
  props: AffordabilityCalculatorProps & { prominence?: Prominence }
) {
  const { mode, prominence = "standard" } = props;

  return (
    <Card
      prominence={prominence}
      eyebrow={eyebrow[mode]}
      title={heading[mode]}
      aside={
        props.calculatedOn && mode === "confirm" ? (
          <Pill label={`Updated ${props.calculatedOn}`} tone="neutral" />
        ) : undefined
      }
    >
      {mode === "explore" && <ExploreMode {...props} />}
      {mode === "confirm" && <ConfirmMode {...props} />}
      {mode === "moving" && <MovingMode {...props} />}

      <p className="mt-[var(--u-stack)] text-[length:var(--u-text-xs)] leading-relaxed text-[var(--u-ink-faint)]">
        An illustration only. It is not a mortgage offer and does not commit
        Unicorn to lend.
      </p>
    </Card>
  );
}

/* --- explore ------------------------------------------------------------ */
// For someone who does not know where to start. Nothing is fixed: move the
// sliders and watch the range move. Deliberately expressed as a range, because
// a single precise number would imply a decision she has not made yet.

function ExploreMode({
  income = 38000,
  deposit = 18000,
  prominence = "standard",
}: AffordabilityCalculatorProps & { prominence?: Prominence }) {
  const [currentIncome, setIncome] = useState(income);
  const [currentDeposit, setDeposit] = useState(deposit);

  const low = currentIncome * MULTIPLE.low;
  const high = currentIncome * MULTIPLE.high;
  const budgetLow = low + currentDeposit;
  const budgetHigh = high + currentDeposit;

  return (
    <div className="space-y-[var(--u-stack)]">
      <p className="max-w-prose text-[length:var(--u-text-base)] leading-relaxed text-[var(--u-ink-soft)]">
        Move the sliders to see roughly where you stand. Nothing here is saved
        and nothing is an application.
      </p>

      <div className="space-y-4 rounded-xl bg-[var(--u-surface-sunken)] p-4">
        <Slider
          label="Your annual income"
          value={currentIncome}
          min={18000}
          max={120000}
          step={1000}
          display={gbp(currentIncome)}
          onChange={setIncome}
        />
        <Slider
          label="Deposit you'll have"
          value={currentDeposit}
          min={0}
          max={120000}
          step={1000}
          display={gbp(currentDeposit)}
          onChange={setDeposit}
        />
      </div>

      <div className="rounded-xl border border-[var(--u-accent-line)] bg-[var(--u-accent-soft)] p-4">
        <p className="text-[length:var(--u-text-xs)] font-semibold uppercase tracking-[0.09em] text-[var(--u-accent-deep)]">
          You might borrow around
        </p>
        <p
          className={`u-figure mt-1 font-semibold text-[var(--u-accent-deep)] ${
            prominence === "hero"
              ? "text-[length:var(--u-text-3xl)]"
              : prominence === "muted"
                ? "text-[length:var(--u-text-xl)]"
                : "text-[length:var(--u-text-2xl)]"
          }`}
        >
          {gbp(low)} – {gbp(high)}
        </p>
        <p className="mt-2 text-[length:var(--u-text-sm)] text-[var(--u-accent-deep)] opacity-90">
          With your deposit, that puts homes between{" "}
          <span className="u-figure font-semibold">{gbp(budgetLow)}</span> and{" "}
          <span className="u-figure font-semibold">{gbp(budgetHigh)}</span>{" "}
          within reach.
        </p>
      </div>

      {prominence !== "muted" && (
        <div className="flex flex-wrap items-center gap-3">
          <Button label="See what this means" tone="secondary" />
          <span className="text-[length:var(--u-text-sm)] text-[var(--u-ink-faint)]">
            No credit check, no impact on your score.
          </span>
        </div>
      )}
    </div>
  );
}

/* --- confirm ------------------------------------------------------------ */
// For someone who has already given us their details. The figure is fixed and
// stated plainly; what is adjustable is the *shape* of the repayment.

function ConfirmMode({
  maxBorrowing = 245000,
  deposit = 42000,
  monthlyIllustration,
  rate = 4.59,
  termYears = 30,
  prominence = "standard",
}: AffordabilityCalculatorProps & { prominence?: Prominence }) {
  const [term, setTerm] = useState(termYears);

  const monthly =
    term === termYears && monthlyIllustration !== undefined
      ? monthlyIllustration
      : monthlyPayment(maxBorrowing, rate, term);

  const budget = maxBorrowing + deposit;
  const totalPaid = monthly * term * 12;

  return (
    <div className="space-y-[var(--u-stack)]">
      <div className="flex flex-wrap items-end justify-between gap-[var(--u-gap)]">
        <Figure
          label="Indicative borrowing"
          value={gbp(maxBorrowing)}
          sub={`With your ${gbp(deposit)} deposit, a budget of ${gbp(budget)}`}
          prominence={prominence === "muted" ? "muted" : "hero"}
          tone="accent"
        />
        <div className="text-right">
          <p className="text-[length:var(--u-text-xs)] font-semibold uppercase tracking-[0.09em] text-[var(--u-ink-faint)]">
            Monthly, over {term} years
          </p>
          <p className="u-figure text-[length:var(--u-text-2xl)] font-semibold text-[var(--u-ink)]">
            {gbpExact(monthly)}
          </p>
        </div>
      </div>

      {prominence !== "muted" && (
        <>
          <div className="rounded-xl bg-[var(--u-surface-sunken)] p-4">
            <Slider
              label="Repayment term"
              value={term}
              min={10}
              max={35}
              step={1}
              display={`${term} years`}
              onChange={setTerm}
            />
            <p className="mt-2 text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
              A longer term lowers the monthly payment but costs more overall.
            </p>
          </div>

          <div className="divide-y divide-[var(--u-line)]">
            <Row label="Illustrative rate" value={`${rate.toFixed(2)}% fixed`} />
            <Row label="Total repayable over the term" value={gbp(totalPaid)} />
            <Row
              label="Of which is interest"
              value={gbp(Math.max(0, totalPaid - maxBorrowing))}
            />
          </div>

          <Button
            label="Continue to an agreement in principle"
            tone={prominence === "hero" ? "primary" : "secondary"}
            size={prominence === "hero" ? "lg" : "md"}
          />
        </>
      )}
    </div>
  );
}

/* --- moving ------------------------------------------------------------- */
// For someone who already owns. The starting point is not income, it is the
// equity in the home they are standing in — so the maths runs the other way:
// pick a target price, and see what new borrowing that implies.

function MovingMode({
  propertyValue = 340000,
  mortgageBalance = 182000,
  maxBorrowing = 295000,
  rate = 4.59,
  termYears = 22,
  prominence = "standard",
}: AffordabilityCalculatorProps & { prominence?: Prominence }) {
  const equity = Math.max(0, propertyValue - mortgageBalance);

  // Open somewhere the customer can actually afford — a step up from the home
  // they own, but inside what we would lend. Dragging past the limit is then a
  // thing they discover, not the state they arrive in.
  const ceiling = equity + maxBorrowing;
  const suggested =
    Math.floor(Math.min(propertyValue * 1.35, ceiling * 0.92) / 5000) * 5000;
  const [targetPrice, setTargetPrice] = useState(suggested);

  // Equity becomes the deposit on the next home; everything above it is borrowed.
  const newMortgage = Math.max(0, targetPrice - equity);
  const additionalBorrowing = Math.max(0, newMortgage - mortgageBalance);
  const withinLimit = newMortgage <= maxBorrowing;
  const shortfall = Math.max(0, newMortgage - maxBorrowing);
  const monthly = monthlyPayment(newMortgage, rate, termYears);

  return (
    <div className="space-y-[var(--u-stack)]">
      <div className="grid gap-[var(--u-gap)] sm:grid-cols-2">
        <Figure
          label="Equity to put down"
          value={gbp(equity)}
          sub="From the home you own now"
          prominence={prominence === "hero" ? "standard" : "muted"}
          tone="accent"
        />
        <Figure
          label="You could borrow up to"
          value={gbp(maxBorrowing)}
          sub="Based on what we already know"
          prominence={prominence === "hero" ? "standard" : "muted"}
        />
      </div>

      <div className="rounded-xl bg-[var(--u-surface-sunken)] p-4">
        <Slider
          label="Price of your next home"
          value={targetPrice}
          min={Math.round(propertyValue / 10000) * 10000}
          max={Math.round((propertyValue * 2) / 10000) * 10000}
          step={5000}
          display={gbp(targetPrice)}
          onChange={setTargetPrice}
        />
      </div>

      <div
        className={`rounded-xl border p-4 ${
          withinLimit
            ? "border-transparent bg-[var(--u-positive-soft)]"
            : "border-transparent bg-[var(--u-caution-soft)]"
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p
            className={`text-[length:var(--u-text-base)] font-semibold ${
              withinLimit
                ? "text-[var(--u-positive)]"
                : "text-[var(--u-caution)]"
            }`}
          >
            {withinLimit
              ? `A ${gbp(targetPrice)} home looks within reach`
              : `That's ${gbp(shortfall)} beyond what we could lend`}
          </p>
          <Pill
            label={withinLimit ? "Within your limit" : "Over your limit"}
            tone={withinLimit ? "positive" : "caution"}
          />
        </div>

        <div className="mt-2 divide-y divide-black/5">
          <Row label="New mortgage needed" value={gbp(newMortgage)} emphasis />
          <Row
            label="On top of your current mortgage"
            value={gbp(additionalBorrowing)}
          />
          {withinLimit && (
            <Row
              label={`Monthly, over ${termYears} years`}
              value={gbpExact(monthly)}
            />
          )}
        </div>
      </div>

      {prominence !== "muted" && (
        <Button
          label={withinLimit ? "Explore moving home" : "Talk to an adviser"}
          tone={prominence === "hero" ? "primary" : "secondary"}
          size={prominence === "hero" ? "lg" : "md"}
        />
      )}
    </div>
  );
}
