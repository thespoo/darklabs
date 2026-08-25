// app/dev/renderer/page.tsx
// Chunk 3's acceptance test, as a page rather than a unit test — this build has
// no test runner and a page you can point at during the demo is worth more.
//
// The screen below is hand-written, not fetched. Slots 6 and 7 are deliberately
// broken. Everything above them must render normally, which is the whole claim:
// a bad slot degrades to a card, it does not take the page with it.

import type { Screen, Slot } from "@/lib/contract";
import { ScreenRenderer } from "@/components/ScreenRenderer";

export const metadata = { title: "Renderer test · Unicorn SDUI" };

const screen: Screen = {
  screen: "home",
  personaId: "test",
  level: "bronze",
  version: "1.0.0",
  theme: { accent: "teal", density: "comfortable", scale: "md" },
  slots: [
    {
      id: "one-hero-intro",
      component: "LifeStageIntro",
      prominence: "hero",
      span: "full",
      props: {
        headline: "1 — LifeStageIntro at hero, full span",
        body: "First in the array, so first on the page. Nothing about this order is computed on the client.",
        illustration: "saving",
      },
    },
    {
      id: "two-standard-savings",
      component: "SavingsProgressCard",
      prominence: "standard",
      span: "half",
      props: {
        label: "2 — SavingsProgressCard, standard, half span",
        current: 18400,
        target: 32000,
        monthlyContribution: 620,
      },
    },
    {
      id: "three-standard-status",
      component: "StatusCard",
      prominence: "standard",
      span: "half",
      props: {
        title: "3 — StatusCard, standard, half span",
        status: "in_progress",
        completedSteps: 3,
        totalSteps: 5,
        ctaLabel: "Continue",
      },
    },
    {
      id: "four-muted-content",
      component: "ContentCard",
      prominence: "muted",
      span: "full",
      props: {
        headline: "4 — ContentCard at muted, full span",
        layout: "list",
        items: [
          { title: "Muted drops the descriptions", meta: "4 min" },
          { title: "And caps the list at three", meta: "3 min" },
          { title: "Because you have seen this already", meta: "6 min" },
          { title: "This fourth item should not appear", meta: "9 min" },
        ],
      },
    },
    {
      id: "five-hero-action",
      component: "NextActionCard",
      prominence: "hero",
      span: "full",
      props: {
        headline: "5 — NextActionCard at hero with high emphasis",
        body: "At hero prominence a high-emphasis action takes the whole card.",
        ctaLabel: "Do the thing",
        emphasis: "high",
      },
    },
    {
      // Right component name, wrong props: `current` is a string and `target`
      // is missing entirely.
      id: "six-broken-props",
      component: "SavingsProgressCard",
      prominence: "standard",
      span: "half",
      props: {
        label: "6 — deliberately broken props",
        current: "eighteen thousand",
        monthlyContribution: 620,
      },
    },
    // A component name that is not in the registry at all. The cast is the
    // point: ComponentNameSchema will not let this be written honestly, which
    // is exactly why the renderer still has to survive it — the tree arrives
    // over HTTP, and a registry that drifted from the enum would produce this.
    {
      id: "seven-unknown-component",
      component: "RatePlannerCard" as Slot["component"],
      prominence: "standard",
      span: "half",
      props: { rate: 4.59 },
    },
    {
      id: "eight-muted-adviser",
      component: "AdviserCard",
      prominence: "muted",
      span: "full",
      props: {
        headline: "8 — AdviserCard at muted, and the page is still alive",
        availability: "Rendered after two broken slots",
        ctaLabel: "Book a call",
      },
    },
  ],
  trace: [],
};

export default function RendererTestPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--u-ink-faint)]">
          Chunk 3 · renderer test
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          A hand-written layout tree
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--u-ink-soft)]">
          Eight slots, numbered in array order, rendered by{" "}
          <code className="font-mono text-sm">ScreenRenderer</code> with no
          sorting and no filtering. Slots 6 and 7 are broken on purpose: slot 6
          has props that fail its schema, slot 7 names a component that is not in
          the registry at all. Both degrade to a card. Slot 8 still renders.
        </p>
      </header>

      <ScreenRenderer screen={screen} />
    </main>
  );
}
