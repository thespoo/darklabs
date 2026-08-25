"use client";

// components/DemoBar.tsx
// The presenter's controls: three personas, three levels. Switching either one
// changes the query string and refetches. No page reload, no rebuild.
//
// The persona list comes from /api/personas rather than being written here, so
// a fourth config file on disk puts a fourth button in this bar.

import type { Level } from "@/lib/contract";

export type DemoSignal = {
  key: string;
  label: string;
  value: string | number | boolean;
  note?: string;
};

export type Persona = {
  id: string;
  name: string;
  summary: string;
  demoSignals: DemoSignal[];
};

/** The query-string form of a fired signal: "key:value". */
export function signalParam(signal: DemoSignal): string {
  return `${signal.key}:${signal.value}`;
}

const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: "bronze", label: "Bronze", blurb: "The base layout for this customer" },
  { id: "silver", label: "Silver", blurb: "Reordered by what we already know" },
  { id: "gold", label: "Gold", blurb: "Re-weighted by how they've behaved" },
];

export function DemoBar({
  personas,
  personaId,
  level,
  firedSignals,
  onChange,
  onFireSignal,
}: {
  personas: Persona[];
  personaId: string;
  level: string;
  firedSignals: string[];
  onChange: (next: { personaId?: string; level?: Level }) => void;
  onFireSignal: (signal: DemoSignal) => void;
}) {
  const current = personas.find((p) => p.id === personaId);
  const signals = current?.demoSignals ?? [];

  return (
    <header className="sticky top-0 z-20 -mx-6 mb-[var(--u-gap)] border-b border-[var(--u-line)] bg-[var(--u-surface)]/90 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <p className="text-lg font-semibold tracking-tight">Unicorn</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Personas */}
          <div className="flex items-center gap-1.5">
            {personas.map((persona) => {
              const active = persona.id === personaId;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => onChange({ personaId: persona.id })}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[var(--u-accent)] text-[var(--u-accent-on)]"
                      : "text-[var(--u-ink-soft)] hover:bg-[var(--u-surface-sunken)]"
                  }`}
                >
                  {persona.name}
                </button>
              );
            })}
          </div>

          {/* Levels */}
          <div
            role="group"
            aria-label="Maturity level"
            className="flex items-center rounded-full border border-[var(--u-line-strong)] p-0.5"
          >
            {LEVELS.map((option) => {
              const active = option.id === level;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ level: option.id })}
                  aria-pressed={active}
                  title={option.blurb}
                  className={`rounded-full px-3.5 py-1 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[var(--u-ink)] text-white"
                      : "text-[var(--u-ink-faint)] hover:text-[var(--u-ink)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* One line so the room knows who they are looking at. */}
      {current?.summary && (
        <p className="mt-2 text-sm text-[var(--u-ink-soft)]">
          <span className="font-semibold text-[var(--u-ink)]">
            {current.name}
          </span>{" "}
          — {current.summary}
        </p>
      )}

      {/*
        Fire a signal. Scripted and illustrative, per the brief — this flips one
        value and refetches. There is no tracking and nothing predictive behind
        it, and it only means anything at Gold.
      */}
      {level === "gold" && signals.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--u-ink-faint)]">
            Fire a signal
          </span>
          {signals.map((signal) => {
            const fired = firedSignals.includes(signalParam(signal));
            return (
              <button
                key={signal.key}
                type="button"
                onClick={() => onFireSignal(signal)}
                aria-pressed={fired}
                title={signal.note}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  fired
                    ? "border-transparent bg-[var(--u-positive)] text-white"
                    : "border-[var(--u-line-strong)] text-[var(--u-ink-soft)] hover:border-[var(--u-accent)] hover:text-[var(--u-accent)]"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${fired ? "bg-white" : "bg-[var(--u-line-strong)]"}`}
                />
                {signal.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
