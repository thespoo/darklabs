// components/ui/primitives.tsx
// Small shared pieces. Buttons, pills, progress bars and figures appear across
// most of the ten components; they read tokens so chunk 9 gets them for free.

import type { ReactNode } from "react";
import type { Prominence } from "@/lib/contract";

/* --- Button ------------------------------------------------------------- */

export function Button({
  label,
  tone = "primary",
  size = "md",
}: {
  label: string;
  tone?: "primary" | "secondary" | "quiet";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    primary:
      "bg-[var(--u-accent)] text-[var(--u-accent-on)] border border-[var(--u-accent)] hover:bg-[var(--u-accent-deep)] hover:border-[var(--u-accent-deep)]",
    secondary:
      "bg-[var(--u-surface)] text-[var(--u-accent)] border border-[var(--u-accent-line)] hover:bg-[var(--u-accent-soft)]",
    quiet:
      "bg-transparent text-[var(--u-ink-soft)] border border-[var(--u-line-strong)] hover:bg-[var(--u-surface-sunken)]",
  } as const;

  const sizes = {
    sm: "px-3 py-1.5 text-[length:var(--u-text-xs)]",
    md: "px-4 py-2 text-[length:var(--u-text-sm)]",
    lg: "px-5 py-2.5 text-[length:var(--u-text-base)]",
  } as const;

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full font-semibold transition-colors ${tones[tone]} ${sizes[size]}`}
    >
      {label}
    </button>
  );
}

/* --- Pill --------------------------------------------------------------- */

export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "accent" | "positive" | "caution";
}) {
  const tones = {
    neutral:
      "bg-[var(--u-surface-sunken)] text-[var(--u-ink-soft)] border-[var(--u-line)]",
    accent:
      "bg-[var(--u-accent-soft)] text-[var(--u-accent-deep)] border-[var(--u-accent-line)]",
    positive:
      "bg-[var(--u-positive-soft)] text-[var(--u-positive)] border-transparent",
    caution:
      "bg-[var(--u-caution-soft)] text-[var(--u-caution)] border-transparent",
  } as const;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[length:var(--u-text-xs)] font-semibold ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

/* --- Figure ------------------------------------------------------------- */

/** A headline number with its label. The prominence decides how loud it is. */
export function Figure({
  label,
  value,
  sub,
  prominence = "standard",
  tone = "ink",
}: {
  label: string;
  value: string;
  sub?: string;
  prominence?: Prominence;
  tone?: "ink" | "accent" | "positive";
}) {
  const sizes: Record<Prominence, string> = {
    hero: "text-[length:var(--u-text-3xl)]",
    standard: "text-[length:var(--u-text-2xl)]",
    muted: "text-[length:var(--u-text-xl)]",
  };

  const tones = {
    ink: "text-[var(--u-ink)]",
    accent: "text-[var(--u-accent)]",
    positive: "text-[var(--u-positive)]",
  } as const;

  return (
    <div>
      <p className="text-[length:var(--u-text-xs)] font-semibold uppercase tracking-[0.09em] text-[var(--u-ink-faint)]">
        {label}
      </p>
      <p
        className={`u-figure mt-0.5 font-semibold ${sizes[prominence]} ${tones[tone]}`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
          {sub}
        </p>
      )}
    </div>
  );
}

/* --- Progress ----------------------------------------------------------- */

export function Progress({
  percent,
  tone = "accent",
  thick = false,
}: {
  percent: number;
  tone?: "accent" | "positive";
  thick?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const fill =
    tone === "positive" ? "bg-[var(--u-positive)]" : "bg-[var(--u-accent)]";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-[var(--u-line)] ${thick ? "h-3" : "h-2"}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${fill}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* --- Row ---------------------------------------------------------------- */

/** A label/value line. Used wherever a component lists facts about an account. */
export function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
        {label}
      </span>
      <span
        className={`u-figure text-right text-[length:var(--u-text-base)] ${
          emphasis
            ? "font-semibold text-[var(--u-ink)]"
            : "font-medium text-[var(--u-ink)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* --- Slider ------------------------------------------------------------- */

export function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[length:var(--u-text-sm)] font-medium text-[var(--u-ink-soft)]">
          {label}
        </span>
        <span className="u-figure text-[length:var(--u-text-lg)] font-semibold text-[var(--u-ink)]">
          {display}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--u-line)] accent-[var(--u-accent)]"
      />
    </label>
  );
}
