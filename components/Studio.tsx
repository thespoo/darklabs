"use client";

// components/Studio.tsx
// P3: a config change updates the screen without rebuilding it.
//
// Left pane is the persona's layout file as text. Right pane is that text run
// through the real pipeline. Reorder two slots on the left and the app on the
// right reorders. No deploy, no release, no app store.
//
// The right pane only ever changes to a screen that validated. A half-typed
// bracket leaves the last good render in place with a warning above it,
// because a blank pane mid-demo reads as "it broke".

import { useCallback, useEffect, useRef, useState } from "react";
import { ScreenSchema, type Level, type Screen } from "@/lib/contract";
import { ScreenRenderer } from "./ScreenRenderer";
import type { Persona } from "./DemoBar";

type Issue = { path: string; message: string };
type Status =
  | { kind: "ok" }
  | { kind: "syntax"; message: string }
  | { kind: "invalid"; message: string; issues: Issue[] }
  | { kind: "saved" }
  | { kind: "saving" };

const LEVELS: Level[] = ["bronze", "silver", "gold"];
const DEBOUNCE_MS = 300;

export function Studio() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaId, setPersonaId] = useState("priya");
  const [level, setLevel] = useState<Level>("bronze");

  const [text, setText] = useState("");
  const [screen, setScreen] = useState<Screen | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "ok" });
  const [dirty, setDirty] = useState(false);

  // Guards against a slow preview response overwriting a newer one.
  const requestId = useRef(0);

  /* --- load the switcher and the file ---------------------------------- */

  useEffect(() => {
    let cancelled = false;
    fetch("/api/personas", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { personas: Persona[] }) => {
        if (!cancelled) setPersonas(body.personas);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/config?personaId=${personaId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { text?: string }) => {
        if (!cancelled && typeof body.text === "string") {
          setText(body.text);
          setDirty(false);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [personaId]);

  /* --- debounced preview ------------------------------------------------ */

  const preview = useCallback(
    async (source: string, forPersona: string, atLevel: Level) => {
      if (source.trim() === "") return;

      let config: unknown;
      try {
        config = JSON.parse(source);
      } catch (error) {
        // Syntax error: say so, and leave the right pane exactly as it is.
        setStatus({ kind: "syntax", message: (error as Error).message });
        return;
      }

      const id = ++requestId.current;

      try {
        const response = await fetch("/api/experience/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: forPersona, level: atLevel, config }),
        });
        const body = await response.json();
        if (id !== requestId.current) return;

        if (!response.ok) {
          setStatus({
            kind: "invalid",
            message: body.message ?? "This config doesn't match the contract.",
            issues: body.issues ?? [],
          });
          return;
        }

        const parsed = ScreenSchema.safeParse(body);
        if (!parsed.success) return;

        setScreen(parsed.data);
        setStatus({ kind: "ok" });
      } catch (error) {
        if (id !== requestId.current) return;
        setStatus({ kind: "syntax", message: (error as Error).message });
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void preview(text, personaId, level);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, personaId, level, preview]);

  /* --- save ------------------------------------------------------------- */

  async function save() {
    setStatus({ kind: "saving" });
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId, text }),
    });
    const body = await response.json();

    if (!response.ok) {
      setStatus({
        kind: "invalid",
        message: body.message ?? "Couldn't save.",
        issues: body.issues ?? [],
      });
      return;
    }

    setDirty(false);
    setStatus({ kind: "saved" });
  }

  /* --- render ----------------------------------------------------------- */

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[var(--u-line)] bg-[var(--u-surface)] px-6 py-3">
        <div className="flex items-baseline gap-3">
          <p className="text-lg font-semibold tracking-tight">Unicorn</p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--u-ink-faint)]">
            Config studio
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-1.5">
            {personas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => setPersonaId(persona.id)}
                aria-pressed={persona.id === personaId}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  persona.id === personaId
                    ? "bg-[var(--u-accent)] text-[var(--u-accent-on)]"
                    : "text-[var(--u-ink-soft)] hover:bg-[var(--u-surface-sunken)]"
                }`}
              >
                {persona.name}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-full border border-[var(--u-line-strong)] p-0.5">
            {LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLevel(option)}
                aria-pressed={option === level}
                className={`rounded-full px-3 py-1 text-sm font-semibold capitalize transition-colors ${
                  option === level
                    ? "bg-[var(--u-ink)] text-white"
                    : "text-[var(--u-ink-faint)] hover:text-[var(--u-ink)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!dirty || status.kind === "saving"}
            className="rounded-full bg-[var(--u-ink)] px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
          >
            {status.kind === "saving" ? "Saving…" : "Save to disk"}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* --- editor --- */}
        <section className="flex min-h-0 flex-col border-r border-[var(--u-line)] bg-[#10141b]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-2.5">
            <p className="font-mono text-xs text-white/50">
              config/personas/{personaId}.json
              {dirty && <span className="ml-2 text-[var(--u-caution)]">● unsaved</span>}
            </p>
          </div>

          <textarea
            value={text}
            spellCheck={false}
            onChange={(event) => {
              setText(event.target.value);
              setDirty(true);
            }}
            className="min-h-0 flex-1 resize-none bg-transparent px-5 py-4 font-mono text-[13px] leading-relaxed text-[#d7e0ea] outline-none"
          />

          <StatusBar status={status} />
        </section>

        {/* --- live app --- */}
        <section className="flex min-h-0 flex-col bg-[var(--u-page)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--u-line)] bg-[var(--u-surface)] px-5 py-2.5">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--u-ink-faint)]">
              Live · {personaId} · {level}
            </p>
            {status.kind !== "ok" && status.kind !== "saved" && screen && (
              <p className="text-xs font-semibold text-[var(--u-caution)]">
                Showing the last version that worked
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {screen ? (
              <ScreenRenderer screen={screen} />
            ) : (
              <p className="text-sm text-[var(--u-ink-faint)]">
                Nothing rendered yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusBar({ status }: { status: Status }) {
  if (status.kind === "ok") {
    return (
      <div className="border-t border-white/10 px-5 py-3">
        <p className="flex items-center gap-2 font-mono text-xs text-[#6ee7b7]">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#6ee7b7]" />
          Valid — the pane on the right is this config
        </p>
      </div>
    );
  }

  if (status.kind === "saved") {
    return (
      <div className="border-t border-white/10 px-5 py-3">
        <p className="font-mono text-xs text-[#6ee7b7]">
          Written to disk. Reload the app and it is still there.
        </p>
      </div>
    );
  }

  if (status.kind === "saving") {
    return (
      <div className="border-t border-white/10 px-5 py-3">
        <p className="font-mono text-xs text-white/50">Saving…</p>
      </div>
    );
  }

  return (
    <div className="max-h-44 overflow-y-auto border-t border-[#f0b429]/40 bg-[#f0b429]/10 px-5 py-3">
      <p className="font-mono text-xs font-semibold text-[#f5c451]">
        {status.kind === "syntax" ? "Not valid JSON yet" : "Doesn't match the contract"}
      </p>
      <p className="mt-1 font-mono text-xs leading-relaxed text-[#f5c451]/80">
        {status.message}
      </p>
      {status.kind === "invalid" && status.issues.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {status.issues.map((issue, index) => (
            <li key={index} className="font-mono text-xs text-[#f5c451]/80">
              <span className="text-[#f5c451]">{issue.path}</span> — {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
