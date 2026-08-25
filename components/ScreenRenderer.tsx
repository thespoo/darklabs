"use client";

// components/ScreenRenderer.tsx
// The dumb renderer. It walks `slots` in array order and draws what it is told.
//
// It does not sort. It does not filter. It does not decide whether a component
// belongs on this screen — if the server did not put it in `slots`, it does not
// exist. There is no persona, level or signal anywhere in this file, and there
// must never be one.

import type { Screen, Slot } from "@/lib/contract";
import { lookup } from "./registry";
import { FallbackCard, SlotBoundary } from "./SlotBoundary";

const IS_DEV = process.env.NODE_ENV !== "production";

const spanClass = {
  full: "md:col-span-2",
  half: "md:col-span-1",
} as const;

export function ScreenRenderer({ screen }: { screen: Screen }) {
  return (
    <div className="grid grid-cols-1 items-start gap-[var(--u-gap)] md:grid-cols-2">
      {/* Array order is render order. Never sorted. */}
      {screen.slots.map((slot) => (
        <div key={slot.id} className={spanClass[slot.span]}>
          <SlotRenderer slot={slot} />
        </div>
      ))}
    </div>
  );
}

function SlotRenderer({ slot }: { slot: Slot }) {
  const entry = lookup(slot.component);

  // Unknown component name. Loud in dev so it gets fixed; gone in prod so a
  // stale config never puts scaffolding in front of a customer.
  if (!entry) {
    if (!IS_DEV) return null;
    return (
      <FallbackCard
        slotId={slot.id}
        componentName={slot.component}
        heading="Unknown component"
        detail={
          <>
            Nothing in the registry is called{" "}
            <code className="font-mono">{slot.component}</code>. The registry
            holds exactly the ten names in <code className="font-mono">ComponentNameSchema</code>.
          </>
        }
      />
    );
  }

  // Props arrived as `unknown` over HTTP. This is where they become real.
  const parsed = entry.schema.safeParse(slot.props);

  if (!parsed.success) {
    return (
      <FallbackCard
        slotId={slot.id}
        componentName={slot.component}
        heading="This component didn't get what it needs"
        detail={
          <ul className="space-y-0.5">
            {parsed.error.issues.map((issue, index) => (
              <li key={index} className="font-mono text-[length:var(--u-text-xs)]">
                {issue.path.join(".") || "props"} — {issue.message}
              </li>
            ))}
          </ul>
        }
      />
    );
  }

  const Component = entry.component;

  return (
    <SlotBoundary slotId={slot.id} componentName={slot.component}>
      <Component
        {...(parsed.data as Record<string, unknown>)}
        prominence={slot.prominence}
      />
    </SlotBoundary>
  );
}
