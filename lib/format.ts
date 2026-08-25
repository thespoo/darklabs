// lib/format.ts
// Presentation helpers. Money and percentages appear in eight of the ten
// components; formatting them one way everywhere is the difference between
// "a bank built this" and "a hackathon built this".

const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const gbpPence = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** £248,000 */
export function gbp(value: number): string {
  return gbpWhole.format(Math.round(value));
}

/** £1,284.37 — for monthly payment illustrations, where the pence matter. */
export function gbpExact(value: number): string {
  return gbpPence.format(value);
}

/** 4.19% */
export function pct(value: number): string {
  return `${value.toFixed(2)}%`;
}

/** 2028-06-30 → "June 2028" */
export function monthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** 0.62 → 62 (clamped, for progress bars) */
export function toPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (current / target) * 100));
}

/**
 * Standard repayment mortgage monthly payment.
 * Not real affordability logic — a plausible formula, per the spec's scope.
 */
export function monthlyPayment(
  principal: number,
  annualRatePercent: number,
  termYears: number
): number {
  const months = termYears * 12;
  if (months <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  );
}
