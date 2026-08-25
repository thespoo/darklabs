"use client";

// components/SlotBoundary.tsx
// Rule 8: never crash the page. Prop validation catches most bad configs, but
// a component can still throw while rendering. One boundary per slot means the
// blast radius of that is one card, not the whole screen.

import { Component, type ReactNode } from "react";

type Props = { slotId: string; componentName: string; children: ReactNode };
type State = { error: Error | null };

export class SlotBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <FallbackCard
          slotId={this.props.slotId}
          componentName={this.props.componentName}
          heading="This component failed to render"
          detail={this.state.error.message}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * What a slot degrades to. Deliberately calm and card-shaped: on a projector it
 * reads as a component that isn't ready, not as a stack trace.
 */
export function FallbackCard({
  slotId,
  componentName,
  heading,
  detail,
}: {
  slotId: string;
  componentName: string;
  heading: string;
  detail?: ReactNode;
}) {
  return (
    <section
      data-fallback={slotId}
      className="h-full rounded-[var(--u-radius)] border border-dashed border-[var(--u-line-strong)] bg-[var(--u-surface-sunken)] p-[var(--u-pad)]"
    >
      <p className="font-mono text-[length:var(--u-text-xs)] uppercase tracking-[0.1em] text-[var(--u-ink-faint)]">
        {slotId} · {componentName}
      </p>
      <p className="mt-1.5 text-[length:var(--u-text-base)] font-semibold text-[var(--u-ink-soft)]">
        {heading}
      </p>
      {detail && (
        <div className="mt-2 text-[length:var(--u-text-sm)] leading-relaxed text-[var(--u-ink-faint)]">
          {detail}
        </div>
      )}
    </section>
  );
}
