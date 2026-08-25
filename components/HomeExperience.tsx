"use client";

// components/HomeExperience.tsx
// The client half of the demo. It fetches a layout tree over HTTP and hands it
// to the renderer. That the fetch is visible in the network tab is a demo
// requirement, not an accident — see rule 3 in CLAUDE.md.
//
// This file knows about personas only as a string in a query param. It has no
// idea what a persona *is*, and it never looks at one to decide what to draw.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenSchema, type Level, type Screen } from "@/lib/contract";
import { ScreenRenderer } from "./ScreenRenderer";
import { DemoBar, signalParam, type DemoSignal, type Persona } from "./DemoBar";
import { TracePanel } from "./TracePanel";

type ApiError = {
  error: string;
  message: string;
  issues?: { path: string; message: string }[];
};

export function HomeExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const personaId = params.get("personaId") ?? "maya";
  const level = params.get("level") ?? "bronze";
  const customerId = params.get("customerId") ?? undefined;
  // Fired signals live in the URL, so a fired screen is a link — shareable, and
  // recoverable with the back button if something goes wrong mid-demo.
  const firedSignals = params.getAll("signal");

  // One key per request. Everything below is derived from whether the result
  // we're holding belongs to the request we're currently making, which avoids
  // storing "loading" and "error" as state that has to be kept in step.
  const requestKey = `${personaId}|${level}|${customerId ?? ""}|${[...firedSignals].sort().join(",")}`;

  const [result, setResult] = useState<{ key: string; screen: Screen } | null>(
    null
  );
  const [failure, setFailure] = useState<{ key: string; error: ApiError } | null>(
    null
  );

  // The switcher's contents. Fetched once; it does not change while the demo
  // is running.
  const [personas, setPersonas] = useState<Persona[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/personas", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { personas: Persona[] }) => {
        if (!cancelled) setPersonas(body.personas);
      })
      .catch(() => {
        // A switcher that fails to load is survivable; the query string still
        // works. Nothing here should be able to take the page down.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = new URLSearchParams({ personaId, level });
    if (customerId) query.set("customerId", customerId);
    for (const signal of firedSignals) query.append("signal", signal);

    let cancelled = false;

    fetch(`/api/experience/home?${query}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setFailure({ key: requestKey, error: body as ApiError });
          return;
        }

        const parsed = ScreenSchema.safeParse(body);
        if (!parsed.success) {
          setFailure({
            key: requestKey,
            error: {
              error: "Unreadable response",
              message: "The server sent something that isn't a screen.",
              issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          });
          return;
        }

        setResult({ key: requestKey, screen: parsed.data });
      })
      .catch((cause: Error) => {
        if (cancelled) return;
        setFailure({
          key: requestKey,
          error: {
            error: "Couldn't reach the server",
            message: cause.message,
          },
        });
      });

    return () => {
      cancelled = true;
    };
    // firedSignals is folded into requestKey, which is what drives this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, personaId, level, customerId]);

  const error = failure?.key === requestKey ? failure.error : null;
  const loading = result?.key !== requestKey && failure?.key !== requestKey;

  // Rule 8, at the page level: `result` is only ever replaced by a screen that
  // parsed cleanly, so a failed refetch leaves the last working screen on
  // display with the problem stated above it. A blank stage is worse than a
  // stale one.
  const showing = result?.screen ?? null;

  // Switching writes the query string and lets the effect above do the rest.
  // router.replace is a client navigation — no page reload, no rebuild.
  function navigate(
    next: { personaId?: string; level?: Level },
    signals: string[]
  ) {
    const query = new URLSearchParams({
      personaId: next.personaId ?? personaId,
      level: next.level ?? level,
    });
    if (customerId) query.set("customerId", customerId);
    for (const signal of signals) query.append("signal", signal);
    router.replace(`/?${query}`, { scroll: false });
  }

  function switchTo(next: { personaId?: string; level?: Level }) {
    // Switching customer clears any fired signals — they belong to the person
    // they were fired for.
    navigate(next, next.personaId && next.personaId !== personaId ? [] : firedSignals);
  }

  function fireSignal(signal: DemoSignal) {
    const param = signalParam(signal);
    navigate(
      {},
      firedSignals.includes(param)
        ? firedSignals.filter((value) => value !== param)
        : [...firedSignals, param]
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <DemoBar
        personas={personas}
        personaId={personaId}
        level={level}
        firedSignals={firedSignals}
        onChange={switchTo}
        onFireSignal={fireSignal}
      />

      {loading && (
        <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-[var(--u-ink-faint)]">
          <span
            aria-hidden
            className="h-2 w-2 animate-pulse rounded-full bg-[var(--u-accent)]"
          />
          Asking the server for {personaId} at {level}
        </p>
      )}

      {error && <ErrorBanner error={error} stale={showing !== null} />}

      {showing ? (
        <>
          <ScreenRenderer screen={showing} />
          <TracePanel trace={showing.trace} level={showing.level} />
        </>
      ) : loading ? (
        <Skeleton />
      ) : null}
    </div>
  );
}

/* --- chrome ------------------------------------------------------------- */

function ErrorBanner({ error, stale }: { error: ApiError; stale: boolean }) {
  return (
    <div className="mb-[var(--u-gap)] rounded-[var(--u-radius)] border border-[var(--u-caution)] bg-[var(--u-caution-soft)] p-4">
      <p className="text-[length:var(--u-text-base)] font-semibold text-[var(--u-caution)]">
        {error.error}
      </p>
      <p className="mt-1 text-[length:var(--u-text-sm)] text-[var(--u-caution)]">
        {error.message}
      </p>
      {error.issues && error.issues.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {error.issues.map((issue, index) => (
            <li
              key={index}
              className="font-mono text-[length:var(--u-text-xs)] text-[var(--u-caution)]"
            >
              {issue.path || "(root)"} — {issue.message}
            </li>
          ))}
        </ul>
      )}
      {stale && (
        <p className="mt-2 text-[length:var(--u-text-xs)] text-[var(--u-caution)]">
          Still showing the last screen that loaded correctly.
        </p>
      )}
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-[var(--u-gap)] md:grid-cols-2">
      {["full", "full", "half", "half"].map((span, index) => (
        <div
          key={index}
          className={`h-40 animate-pulse rounded-[var(--u-radius)] bg-[var(--u-line)] ${
            span === "full" ? "md:col-span-2" : ""
          }`}
        />
      ))}
    </div>
  );
}
