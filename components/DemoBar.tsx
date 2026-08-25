"use client";

// components/DemoBar.tsx
// The presenter's controls: three personas, three levels. Switching either one
// changes the query string and refetches. No page reload, no rebuild.
//
// The persona list comes from /api/personas rather than being written here, so
// a fourth config file on disk puts a fourth button in this bar.

import type { Level } from "@/lib/contract";

export type Persona = { id: string; name: string; summary: string };

const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: "bronze", label: "Bronze", blurb: "The base layout for this customer" },
  { id: "silver", label: "Silver", blurb: "Reordered by what we already know" },
  { id: "gold", label: "Gold", blurb: "Re-weighted by how they've behaved" },
];

export function DemoBar({
  personas,
  personaId,
  level,
  onChange,
}: {
  personas: Persona[];
  personaId: string;
  level: string;
  onChange: (next: { personaId?: string; level?: Level }) => void;
}) {
  const current = personas.find((p) => p.id === personaId);

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
    </header>
  );
}
