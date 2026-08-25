// app/gallery/page.tsx
// Every component, every variant, every prominence, with realistic props.
// This route is also the safety net: if the renderer breaks mid-demo, the
// component library is still standing here.

import type { ReactNode } from "react";
import type { Prominence } from "@/lib/contract";

import { AffordabilityCalculator } from "@/components/AffordabilityCalculator";
import { MortgageSummary } from "@/components/MortgageSummary";
import { EquityCard } from "@/components/EquityCard";
import { SavingsProgressCard } from "@/components/SavingsProgressCard";
import { StatusCard } from "@/components/StatusCard";
import { Checklist } from "@/components/Checklist";
import { LifeStageIntro } from "@/components/LifeStageIntro";
import { ContentCard } from "@/components/ContentCard";
import { NextActionCard } from "@/components/NextActionCard";
import { AdviserCard } from "@/components/AdviserCard";

const PROMINENCES: Prominence[] = ["hero", "standard", "muted"];

export const metadata = { title: "Component library · Unicorn SDUI" };

/* --- page furniture ----------------------------------------------------- */

function Section({
  name,
  kind,
  purpose,
  children,
}: {
  name: string;
  kind: "Substantive" | "Simple card";
  purpose: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-24 border-t border-[var(--u-line)] pt-10" id={name}>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-mono text-xl font-semibold tracking-tight text-[var(--u-ink)]">
          {name}
        </h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            kind === "Substantive"
              ? "bg-[var(--u-accent-soft)] text-[var(--u-accent-deep)]"
              : "bg-[var(--u-surface-sunken)] text-[var(--u-ink-faint)]"
          }`}
        >
          {kind}
        </span>
        <p className="w-full text-sm text-[var(--u-ink-soft)] sm:w-auto">
          {purpose}
        </p>
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

/** One variant of a component, rendered at all three prominence levels. */
function Variants({
  label,
  render,
}: {
  label: string;
  render: (prominence: Prominence) => ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-[var(--u-ink-faint)]">
        {label}
      </p>
      <div className="grid items-start gap-5 lg:grid-cols-3">
        {PROMINENCES.map((prominence) => (
          <div key={prominence}>
            <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--u-ink-faint)]">
              {prominence}
            </p>
            {render(prominence)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- page --------------------------------------------------------------- */

export default function GalleryPage() {
  return (
    <main className="mx-auto max-w-[100rem] px-6 py-12">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--u-ink-faint)]">
          Unicorn · Server-driven UI
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--u-ink)]">
          The component library
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--u-ink-soft)]">
          Ten components — six substantive, four simple cards. Every screen in
          this build is assembled from exactly these, and nothing else. Each one
          is presentational: props in, markup out. None of them knows who is
          looking at it or what maturity level produced it.
        </p>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--u-ink-soft)]">
          <strong className="font-semibold text-[var(--u-ink)]">
            Prominence
          </strong>{" "}
          is how the server changes emphasis without changing what exists. The
          three columns below are the same component at{" "}
          <code className="font-mono text-sm">hero</code>,{" "}
          <code className="font-mono text-sm">standard</code> and{" "}
          <code className="font-mono text-sm">muted</code>.
        </p>
      </header>

      <div className="space-y-12">
        {/* ---------------- Substantive ---------------- */}

        <Section
          name="AffordabilityCalculator"
          kind="Substantive"
          purpose="Three modes doing genuinely different work — the server drives behaviour, not just visibility."
        >
          <Variants
            label="mode: explore — open-ended, for someone who doesn't know where to start"
            render={(p) => (
              <AffordabilityCalculator
                mode="explore"
                income={38000}
                deposit={18400}
                prominence={p}
              />
            )}
          />
          <Variants
            label="mode: confirm — a specific figure with a monthly illustration"
            render={(p) => (
              <AffordabilityCalculator
                mode="confirm"
                maxBorrowing={247000}
                deposit={43500}
                monthlyIllustration={1264.18}
                rate={4.59}
                termYears={30}
                calculatedOn="12 August"
                prominence={p}
              />
            )}
          />
          <Variants
            label="mode: moving — equity in, new borrowing out"
            render={(p) => (
              <AffordabilityCalculator
                mode="moving"
                propertyValue={412000}
                mortgageBalance={198450}
                maxBorrowing={335000}
                rate={4.59}
                termYears={22}
                prominence={p}
              />
            )}
          />
        </Section>

        <Section
          name="MortgageSummary"
          kind="Substantive"
          purpose="Priya only. Neither of the other two personas can structurally have this component."
        >
          <Variants
            label="An existing Unicorn mortgage, portable, deal ending within a year"
            render={(p) => (
              <MortgageSummary
                balance={198450}
                rate={3.89}
                termRemaining={266}
                dealEnds="2027-04-30"
                portable
                productName="5 year fixed · Residential"
                monthlyPayment={1142.6}
                accountNumber="•••• 4417"
                prominence={p}
              />
            )}
          />
        </Section>

        <Section
          name="EquityCard"
          kind="Substantive"
          purpose="Priya only. The gap between what the home is worth and what is owed on it."
        >
          <Variants
            label="Estimated equity with headroom for additional borrowing"
            render={(p) => (
              <EquityCard
                propertyValue={412000}
                mortgageBalance={198450}
                estimatedEquity={213550}
                additionalBorrowing={136500}
                valuationBasis="Estimated from sold prices on your street, updated August 2026."
                ctaLabel="Explore additional borrowing"
                prominence={p}
              />
            )}
          />
        </Section>

        <Section
          name="SavingsProgressCard"
          kind="Substantive"
          purpose="Maya's hero — the thing she is actually doing. Daniel carries the same component near-complete."
        >
          <Variants
            label="Part-way to target — Maya"
            render={(p) => (
              <SavingsProgressCard
                label="Deposit fund"
                current={18400}
                target={32000}
                monthlyContribution={620}
                targetBasis="Based on a 10% deposit on a £320,000 home in your area."
                prominence={p}
              />
            )}
          />
          <Variants
            label="Target reached — Daniel"
            render={(p) => (
              <SavingsProgressCard
                label="Deposit saved"
                current={43500}
                target={42000}
                monthlyContribution={400}
                prominence={p}
              />
            )}
          />
        </Section>

        <Section
          name="StatusCard"
          kind="Substantive"
          purpose="Agreement in principle or application status. Daniel's hero at Gold."
        >
          <Variants
            label="status: in_progress — 3 of 5, with the blocker named"
            render={(p) => (
              <StatusCard
                status="in_progress"
                completedSteps={3}
                totalSteps={5}
                steps={[
                  "Your details",
                  "Income and employment",
                  "Outgoings",
                  "Credit check",
                  "Your decision",
                ]}
                outstanding="We still need your last three months of payslips to continue."
                ctaLabel="Continue"
                reference="AIP-88421"
                prominence={p}
              />
            )}
          />
          <Variants
            label="status: not_started"
            render={(p) => (
              <StatusCard
                status="not_started"
                completedSteps={0}
                totalSteps={5}
                ctaLabel="Start your agreement in principle"
                prominence={p}
              />
            )}
          />
          <Variants
            label="status: complete / expired"
            render={(p) => (
              <div className="space-y-5">
                <StatusCard
                  status="complete"
                  completedSteps={5}
                  totalSteps={5}
                  ctaLabel="View your decision"
                  reference="AIP-88421"
                  expiresOn="14 November 2026"
                  prominence={p}
                />
                <StatusCard
                  status="expired"
                  completedSteps={5}
                  totalSteps={5}
                  title="Agreement in principle"
                  outstanding="This expired on 3 June. Reapplying takes about ten minutes."
                  ctaLabel="Reapply"
                  prominence={p}
                />
              </div>
            )}
          />
        </Section>

        <Section
          name="Checklist"
          kind="Substantive"
          purpose="Two variants over one shape: the steps of buying, or the documents needed."
        >
          <Variants
            label="variant: buying — Maya"
            render={(p) => (
              <Checklist
                variant="buying"
                items={[
                  { label: "Work out what you can afford", done: true },
                  { label: "Start saving a deposit", done: true },
                  {
                    label: "Get an agreement in principle",
                    done: false,
                    detail: "Shows sellers you're serious. Takes ten minutes.",
                  },
                  { label: "Find a home and make an offer", done: false },
                  { label: "Apply for your mortgage", done: false },
                ]}
                prominence={p}
              />
            )}
          />
          <Variants
            label="variant: documents — Daniel"
            render={(p) => (
              <Checklist
                variant="documents"
                items={[
                  { label: "Photo ID", done: true },
                  { label: "Proof of address", done: true },
                  {
                    label: "Last 3 months' payslips",
                    done: false,
                    detail: "PDF or photo, as long as the figures are legible.",
                  },
                  {
                    label: "Last 3 months' bank statements",
                    done: false,
                    detail: "The account your salary is paid into.",
                  },
                ]}
                prominence={p}
              />
            )}
          />
        </Section>

        {/* ---------------- Simple cards ---------------- */}

        <Section
          name="LifeStageIntro"
          kind="Simple card"
          purpose="Orientation before action — where the customer is in the journey."
        >
          <Variants
            label="illustration: saving"
            render={(p) => (
              <LifeStageIntro
                headline="You're building towards your first home"
                body="You don't need to apply for anything yet. Here's roughly where you stand and the one thing worth doing next."
                illustration="saving"
                prominence={p}
              />
            )}
          />
          <Variants
            label="illustration: searching / moving"
            render={(p) => (
              <div className="space-y-5">
                <LifeStageIntro
                  headline="You're ready to make an offer"
                  body="Your deposit is saved and your agreement in principle is under way."
                  illustration="searching"
                  prominence={p}
                />
                <LifeStageIntro
                  headline="Thinking about a bigger home"
                  body="You already hold a mortgage with us, so we can show you what moving would actually look like."
                  illustration="moving"
                  prominence={p}
                />
              </div>
            )}
          />
        </Section>

        <Section
          name="ContentCard"
          kind="Simple card"
          purpose="Educational content. Gold demotes this once a customer has clearly moved past it."
        >
          <Variants
            label="layout: list"
            render={(p) => (
              <ContentCard
                layout="list"
                items={[
                  {
                    title: "How much deposit do you actually need?",
                    description: "The 5%, 10% and 20% question, answered.",
                    meta: "4 min",
                  },
                  {
                    title: "What is an agreement in principle?",
                    description: "And why sellers ask for one.",
                    meta: "3 min",
                  },
                  {
                    title: "The costs nobody warns you about",
                    description: "Surveys, searches, stamp duty.",
                    meta: "6 min",
                  },
                ]}
                prominence={p}
              />
            )}
          />
          <Variants
            label="layout: cards"
            render={(p) => (
              <ContentCard
                headline="Moving home"
                layout="cards"
                items={[
                  {
                    title: "Porting your mortgage",
                    description: "Taking your current rate with you.",
                    meta: "Guide",
                  },
                  {
                    title: "Buying before you sell",
                    description: "What a bridging arrangement involves.",
                    meta: "Guide",
                  },
                ]}
                prominence={p}
              />
            )}
          />
        </Section>

        <Section
          name="NextActionCard"
          kind="Simple card"
          purpose="The single most important thing to do next. At hero + high emphasis it takes over the card entirely."
        >
          <Variants
            label="emphasis: high"
            render={(p) => (
              <NextActionCard
                headline="Continue your agreement in principle"
                body="You're three steps from a decision."
                ctaLabel="Continue"
                emphasis="high"
                note="About 10 minutes"
                prominence={p}
              />
            )}
          />
          <Variants
            label="emphasis: normal / low"
            render={(p) => (
              <div className="space-y-5">
                <NextActionCard
                  headline="See what you could afford"
                  body="Answer three questions and we'll show you an indicative range."
                  ctaLabel="Try the calculator"
                  emphasis="normal"
                  prominence={p}
                />
                <NextActionCard
                  headline="Set a deposit goal"
                  body="Give yourself something to save towards."
                  ctaLabel="Set a goal"
                  emphasis="low"
                  prominence={p}
                />
              </div>
            )}
          />
        </Section>

        <Section
          name="AdviserCard"
          kind="Simple card"
          purpose="Promoted when the situation is complex enough that a conversation beats another calculator."
        >
          <Variants
            label="With a reason for the conversation"
            render={(p) => (
              <AdviserCard
                headline="Talk it through with an adviser"
                availability="Today until 8pm"
                ctaLabel="Book a call"
                body="Moving with an existing mortgage has more moving parts than a first purchase. Fifteen minutes usually settles it."
                adviserName="Ruth Kelleher"
                prominence={p}
              />
            )}
          />
        </Section>
      </div>
    </main>
  );
}
