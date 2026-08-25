"use client";

// components/HomeExperience.tsx
// The client half of the demo. It fetches a layout tree over HTTP and hands it
// to the renderer. That the fetch is visible in the network tab is a demo
// requirement, not an accident — see rule 3 in CLAUDE.md.
//
// This file knows about personas only as a string in a query param. It has no
// idea what a persona *is*, and it never looks at one to decide what to draw.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenSchema, type Screen } from "@/lib/contract";
import { ScreenRenderer } from "./ScreenRenderer";

type ApiError = {
  error: string;
  message: string;
  issues?: { path: string; message: string }[];
};

export function HomeExperience() {
  const params = useSearchParams();
  const personaId = params.get("personaId") ?? "maya";
  const level = params.get("level") ?? "bronze";
  const customerId = params.get("customerId") ?? undefined;

  // One key per request. Everything below is derived from whether the result
  // we're holding belongs to the request we're currently making, which avoids
  // storing "loading" and "error" as state that has to be kept in step.
  const requestKey = `${personaId}|${level}|${customerId ?? ""}`;

  const [result, setResult] = useState<{ key: string; screen: Screen } | null>(
    null
  );
  const [failure, setFailure] = useState<{ key: string; error: ApiError } | null>(
    null
  );

  useEffect(() => {
    const query = new URLSearchParams({ personaId, level });
    if (customerId) query.set("customerId", customerId);

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
  }, [requestKey, personaId, level, customerId]);

  const error = failure?.key === requestKey ? failure.error : null;
  const loading = result?.key !== requestKey && failure?.key !== requestKey;

  // Rule 8, at the page level: `result` is only ever replaced by a screen that
  // parsed cleanly, so a failed refetch leaves the last working screen on
  // display with the problem stated above it. A blank stage is worse than a
  // stale one.
  const showing = result?.screen ?? null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <AppBar personaId={personaId} level={level} loading={loading} />

      {error && <ErrorBanner error={error} stale={showing !== null} />}

      {showing ? (
        <ScreenRenderer screen={showing} />
      ) : loading ? (
        <Skeleton />
      ) : null}
    </div>
  );
}

/* --- chrome ------------------------------------------------------------- */

function AppBar({
  personaId,
  level,
  loading,
}: {
  personaId: string;
  level: string;
  loading: boolean;
}) {
  return (
    <header className="mb-[var(--u-gap)] flex flex-wrap items-center justify-between gap-3 border-b border-[var(--u-line)] pb-4">
      <p className="text-[length:var(--u-text-lg)] font-semibold tracking-tight">
        Unicorn
      </p>
      <p className="flex items-center gap-2 font-mono text-[length:var(--u-text-xs)] uppercase tracking-[0.1em] text-[var(--u-ink-faint)]">
        <span>{personaId}</span>
        <span aria-hidden>·</span>
        <span>{level}</span>
        {loading && (
          <span
            aria-label="Loading"
            className="h-2 w-2 animate-pulse rounded-full bg-[var(--u-accent)]"
          />
        )}
      </p>
    </header>
  );
}

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
