// components/StatusCard.tsx
// Agreement in principle or application status. Daniel's hero at Gold; Priya
// carries one too. The step tracker is the point — it shows how close you are.

import { z } from "zod";
import type { Prominence } from "@/lib/contract";
import { Card } from "./ui/Card";
import { Button, Pill, Progress } from "./ui/primitives";

export const StatusCardProps = z.object({
  status: z.enum(["not_started", "in_progress", "complete", "expired"]),
  completedSteps: z.number(),
  totalSteps: z.number(),
  title: z.string().default("Agreement in principle"),
  /** Labels for each step, if you want the tracker named rather than numbered. */
  steps: z.array(z.string()).optional(),
  /** What is stopping the next step — surfaced hard at hero prominence. */
  outstanding: z.string().optional(),
  ctaLabel: z.string().optional(),
  reference: z.string().optional(),
  expiresOn: z.string().optional(),
});
export type StatusCardProps = z.input<typeof StatusCardProps>;

const statusMeta = {
  not_started: { label: "Not started", tone: "neutral" as const },
  in_progress: { label: "In progress", tone: "accent" as const },
  complete: { label: "Complete", tone: "positive" as const },
  expired: { label: "Expired", tone: "caution" as const },
};

export function StatusCard({
  status,
  completedSteps,
  totalSteps,
  title = "Agreement in principle",
  steps,
  outstanding,
  ctaLabel,
  reference,
  expiresOn,
  prominence = "standard",
}: StatusCardProps & { prominence?: Prominence }) {
  const meta = statusMeta[status];
  const percent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const remaining = Math.max(0, totalSteps - completedSteps);

  return (
    <Card
      prominence={prominence}
      eyebrow="Your application"
      title={title}
      aside={<Pill label={meta.label} tone={meta.tone} />}
      footer={
        ctaLabel && prominence !== "muted" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              label={ctaLabel}
              tone={prominence === "hero" ? "primary" : "secondary"}
            />
            {reference && (
              <span className="u-figure text-[length:var(--u-text-xs)] text-[var(--u-ink-faint)]">
                Ref {reference}
              </span>
            )}
          </div>
        ) : undefined
      }
    >
      <p className="mb-2 text-[length:var(--u-text-sm)] text-[var(--u-ink-soft)]">
        <span className="u-figure font-semibold text-[var(--u-ink)]">
          {completedSteps} of {totalSteps}
        </span>{" "}
        steps complete
        {remaining > 0 && status !== "expired" && (
          <> — {remaining} to go</>
        )}
      </p>

      <Progress
        percent={percent}
        tone={status === "complete" ? "positive" : "accent"}
        thick={prominence === "hero"}
      />

      {steps && prominence !== "muted" && (
        <ol className="mt-[var(--u-stack)] space-y-1.5">
          {steps.map((step, index) => {
            const done = index < completedSteps;
            const current = index === completedSteps && status !== "complete";
            return (
              <li
                key={step}
                className={`flex items-center gap-2.5 text-[length:var(--u-text-sm)] ${
                  done
                    ? "text-[var(--u-ink-soft)]"
                    : current
                      ? "font-semibold text-[var(--u-ink)]"
                      : "text-[var(--u-ink-faint)]"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    done
                      ? "border-transparent bg-[var(--u-positive)] text-white"
                      : current
                        ? "border-[var(--u-accent)] text-[var(--u-accent)]"
                        : "border-[var(--u-line-strong)] text-[var(--u-ink-faint)]"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </span>
                {step}
              </li>
            );
          })}
        </ol>
      )}

      {outstanding && (
        <p
          className={`mt-[var(--u-stack)] rounded-lg border px-3 py-2 text-[length:var(--u-text-sm)] ${
            prominence === "hero"
              ? "border-transparent bg-[var(--u-caution-soft)] font-medium text-[var(--u-caution)]"
              : "border-[var(--u-line)] bg-[var(--u-surface-sunken)] text-[var(--u-ink-soft)]"
          }`}
        >
          {outstanding}
        </p>
      )}

      {expiresOn && prominence !== "muted" && (
        <p className="mt-2 text-[length:var(--u-text-xs)] text-[var(--u-ink-faint)]">
          Valid until {expiresOn}
        </p>
      )}
    </Card>
  );
}
