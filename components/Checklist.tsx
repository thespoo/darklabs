// components/Checklist.tsx
// Two variants over one shape: the steps of buying a home, or the documents
// needed for an application. Same component, different job.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { Card } from "./ui/Card";
import { Pill, Progress } from "./ui/primitives";

export const ChecklistProps = z.object({
  variant: z.enum(["buying", "documents"]),
  headline: z.string().optional(),
  items: z.array(
    z.object({
      label: z.string(),
      done: z.boolean(),
      detail: z.string().optional(),
    })
  ),
});
export type ChecklistProps = z.input<typeof ChecklistProps>;

const variantMeta = {
  buying: { eyebrow: "Your journey", title: "Steps to buying a home" },
  documents: { eyebrow: "Application", title: "Documents we need" },
};

export function Checklist({
  variant,
  headline,
  items,
  prominence = "standard",
}: ChecklistProps & { prominence?: Prominence }) {
  const meta = variantMeta[variant];
  const done = items.filter((item) => item.done).length;
  const percent = items.length > 0 ? (done / items.length) * 100 : 0;

  // At muted weight the list collapses to what is still outstanding.
  const visible =
    prominence === "muted" ? items.filter((item) => !item.done) : items;

  return (
    <Card
      prominence={prominence}
      eyebrow={meta.eyebrow}
      title={headline ?? meta.title}
      aside={
        <Pill
          label={`${done}/${items.length}`}
          tone={done === items.length ? "positive" : "neutral"}
        />
      }
    >
      {prominence !== "muted" && (
        <div className="mb-[var(--u-stack)]">
          <Progress
            percent={percent}
            tone={done === items.length ? "positive" : "accent"}
          />
        </div>
      )}

      <ul className="space-y-1">
        {visible.map((item) => (
          <li key={item.label} className="flex items-start gap-3 py-1">
            <span
              aria-hidden
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                item.done
                  ? "border-transparent bg-[var(--u-positive)] text-white"
                  : variant === "documents"
                    ? "border-[var(--u-line-strong)] bg-[var(--u-surface)] text-transparent"
                    : "border-[var(--u-accent-line)] bg-[var(--u-accent-soft)] text-transparent"
              }`}
            >
              ✓
            </span>
            <span className="min-w-0">
              <span
                className={`block text-[length:var(--u-text-base)] ${
                  item.done
                    ? "text-[var(--u-ink-faint)] line-through decoration-[var(--u-line-strong)]"
                    : "font-medium text-[var(--u-ink)]"
                }`}
              >
                {item.label}
              </span>
              {item.detail && !item.done && prominence !== "muted" && (
                <span className="mt-0.5 block text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
                  {item.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {prominence === "muted" && visible.length === 0 && (
        <p className="text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
          Everything on this list is done.
        </p>
      )}
    </Card>
  );
}
