"use client";

// components/TracePanel.tsx
// P6: "the team can explain why each change helps the customer."
//
// This is a demo deliverable, not a dev tool. The presenter reads the reasons
// off the screen instead of remembering them, which is why it is written for a
// stakeholder audience and set large enough to read from the back of a room.

import { useState } from "react";
import type { Level, TraceEntry } from "@/lib/contract";

/** What each pipeline stage is called when a human says it out loud. */
const STAGES: Record<
  TraceEntry["stage"],
  { title: string; blurb: string; level: Level }
> = {
  base: {
    title: "Where this screen starts",
    blurb: "The layout we hold for a customer at this point in their journey.",
    level: "bronze",
  },
  context: {
    title: "What we already know about them",
    blurb: "Facts from their relationship with us, applied as rules.",
    level: "silver",
  },
  signal: {
    title: "How they've been behaving",
    blurb: "Recent activity, changing emphasis rather than adding components.",
    level: "gold",
  },
  override: {
    title: "Set for this customer specifically",
    blurb: "A deliberate exception, recorded against their record.",
    level: "gold",
  },
};

const STAGE_ORDER: TraceEntry["stage"][] = [
  "base",
  "context",
  "signal",
  "override",
];

/** Actions, in the words a stakeholder would use. */
const ACTIONS: Record<TraceEntry["action"], { verb: string; tone: string }> = {
  added: { verb: "shown", tone: "bg-[var(--u-accent-soft)] text-[var(--u-accent-deep)]" },
  removed: { verb: "taken off the screen", tone: "bg-[var(--u-surface-sunken)] text-[var(--u-ink-faint)]" },
  moved: { verb: "moved", tone: "bg-[var(--u-accent-soft)] text-[var(--u-accent-deep)]" },
  promoted: { verb: "given more prominence", tone: "bg-[var(--u-positive-soft)] text-[var(--u-positive)]" },
  demoted: { verb: "made quieter", tone: "bg-[var(--u-caution-soft)] text-[var(--u-caution)]" },
  rewritten: { verb: "reworded", tone: "bg-[var(--u-accent-soft)] text-[var(--u-accent-deep)]" },
};

/** "mortgage-summary" reads badly out loud. "Mortgage summary" does not. */
function humanise(slotId: string): string {
  const words = slotId.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function TracePanel({
  trace,
  level,
}: {
  trace: TraceEntry[];
  level: string;
}) {
  const [open, setOpen] = useState(true);

  const groups = STAGE_ORDER.map((stage) => ({
    stage,
    entries: trace.filter((entry) => entry.stage === stage),
  })).filter((group) => group.entries.length > 0);

  const decisions = trace.length;

  return (
    <section className="mt-8 overflow-hidden rounded-[var(--u-radius)] border border-[var(--u-line)] bg-[var(--u-surface)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-[var(--u-surface-sunken)]"
      >
        <span>
          <span className="block text-lg font-semibold tracking-tight text-[var(--u-ink)]">
            Why this screen looks the way it does
          </span>
          <span className="mt-0.5 block text-sm text-[var(--u-ink-soft)]">
            {decisions} {decisions === 1 ? "decision" : "decisions"} the server
            made, at <span className="font-semibold">{level}</span>
          </span>
        </span>
        <span
          aria-hidden
          className={`shrink-0 text-[var(--u-ink-faint)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 6 5 5 5-5" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--u-line)]">
          {groups.length === 0 ? (
            <p className="px-6 py-5 text-[length:var(--u-text-base)] text-[var(--u-ink-soft)]">
              Nothing to explain yet — this screen is the base layout, unchanged.
            </p>
          ) : (
            groups.map((group) => {
              const meta = STAGES[group.stage];
              return (
                <div
                  key={group.stage}
                  className="border-b border-[var(--u-line)] px-6 py-5 last:border-b-0"
                >
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-base font-semibold tracking-tight text-[var(--u-ink)]">
                      {meta.title}
                    </h3>
                    <span className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--u-ink-faint)]">
                      {meta.level}
                    </span>
                    <p className="w-full text-sm text-[var(--u-ink-faint)] sm:w-auto">
                      {meta.blurb}
                    </p>
                  </div>

                  <ol className="space-y-3">
                    {group.entries.map((entry, index) => {
                      const action = ACTIONS[entry.action];
                      return (
                        <li
                          key={`${entry.slotId}-${index}`}
                          className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-l-2 border-[var(--u-line)] pl-4"
                        >
                          <span className="text-base font-semibold text-[var(--u-ink)]">
                            {humanise(entry.slotId)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${action.tone}`}
                          >
                            {action.verb}
                          </span>
                          <p className="w-full text-base leading-relaxed text-[var(--u-ink-soft)]">
                            {entry.reason}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
