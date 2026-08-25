// components/ContentCard.tsx
// Educational content links. Gold demotes this to muted once a customer has
// clearly moved past needing it.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { Card } from "./ui/Card";

export const ContentCardProps = z.object({
  headline: z.string().optional(),
  layout: z.enum(["list", "cards"]).default("list"),
  items: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      meta: z.string().optional(),
    })
  ),
});
export type ContentCardProps = z.input<typeof ContentCardProps>;

export function ContentCard({
  headline,
  layout = "list",
  items,
  prominence = "standard",
}: ContentCardProps & { prominence?: Prominence }) {
  // At muted weight the descriptions go — the customer has seen this before.
  const showDescriptions = prominence !== "muted";
  const visible = prominence === "muted" ? items.slice(0, 3) : items;

  return (
    <Card
      prominence={prominence}
      eyebrow={prominence === "muted" ? "Also available" : "Learn"}
      title={headline ?? "Guides and articles"}
    >
      {layout === "cards" && showDescriptions ? (
        <ul className="grid gap-[var(--u-stack)] sm:grid-cols-2">
          {visible.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-[var(--u-line)] bg-[var(--u-surface-sunken)] p-4"
            >
              {item.meta && (
                <p className="mb-1 text-[length:var(--u-text-xs)] font-semibold uppercase tracking-[0.08em] text-[var(--u-ink-faint)]">
                  {item.meta}
                </p>
              )}
              <p className="text-[length:var(--u-text-base)] font-semibold text-[var(--u-ink)]">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-[length:var(--u-text-sm)] leading-relaxed text-[var(--u-ink-soft)]">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-[var(--u-line)]">
          {visible.map((item) => (
            <li
              key={item.title}
              className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-[length:var(--u-text-base)] font-medium text-[var(--u-ink)]">
                  {item.title}
                </p>
                {item.description && showDescriptions && (
                  <p className="mt-0.5 text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
                    {item.description}
                  </p>
                )}
              </div>
              <span className="flex shrink-0 items-center gap-2 text-[length:var(--u-text-xs)] text-[var(--u-ink-faint)]">
                {item.meta}
                <svg
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="var(--u-accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
