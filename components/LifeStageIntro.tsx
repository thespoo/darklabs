// components/LifeStageIntro.tsx
// Life-stage framing. Orientation, not action — it tells the customer where
// they are in the journey before anything asks them to do something.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { Card } from "./ui/Card";

export const LifeStageIntroProps = z.object({
  headline: z.string(),
  body: z.string(),
  illustration: z.enum(["saving", "searching", "moving"]).optional(),
});
export type LifeStageIntroProps = z.input<typeof LifeStageIntroProps>;

const marks: Record<string, string> = {
  // Coin stack.
  saving: "M6 30h28M9 24h10v6H9zM9 18h10v6H9zM21 12h10v18H21z",
  // Magnifier over a roofline.
  searching: "M6 22 18 11l12 11M9 22v10h18V22M24 27a6 6 0 1 0 12 0 6 6 0 0 0-12 0M34 31l4 5",
  // Two rooflines, one larger.
  moving: "M4 20 14 12l10 8M7 20v12h14V20M20 24l9-7 9 7M23 24v8h12v-8",
};

export function LifeStageIntro({
  headline,
  body,
  illustration,
  prominence = "standard",
}: LifeStageIntroProps & { prominence?: Prominence }) {
  const headlineSize =
    prominence === "hero"
      ? "text-[length:var(--u-text-2xl)]"
      : prominence === "muted"
        ? "text-[length:var(--u-text-lg)]"
        : "text-[length:var(--u-text-xl)]";

  return (
    <Card prominence={prominence}>
      <div className="flex items-start gap-5">
        {illustration && prominence !== "muted" && (
          <span className="hidden shrink-0 rounded-2xl bg-[var(--u-accent-soft)] p-3 sm:block">
            <svg
              viewBox="0 0 44 40"
              className="h-10 w-10"
              fill="none"
              stroke="var(--u-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={marks[illustration]} />
            </svg>
          </span>
        )}
        <div className="min-w-0">
          <h2
            className={`font-semibold tracking-tight text-[var(--u-ink)] ${headlineSize}`}
          >
            {headline}
          </h2>
          <p className="mt-2 max-w-prose text-[length:var(--u-text-base)] leading-relaxed text-[var(--u-ink-soft)]">
            {body}
          </p>
        </div>
      </div>
    </Card>
  );
}
