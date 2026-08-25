# Architecture

Everything hangs off one schema and one pipeline. Read this before changing
anything in `lib/`.

---

## The contract — `lib/contract.ts`

The interface between the backend and the component library. It arrived with the
brief and was moved into place unchanged apart from one additive field (see
`GOTCHAS.md`).

```ts
Screen = {
  screen: "home"
  personaId: string
  level: "bronze" | "silver" | "gold"
  version: string
  theme: { accent: "teal"|"navy"|"plum", density: "compact"|"comfortable"|"spacious", scale: "sm"|"md"|"lg" }
  slots: Slot[]        // ORDER IS THE PRIORITY. Never sorted on the client.
  trace: TraceEntry[]  // why the screen looks like this
}

Slot = {
  id: string                                   // stable; rules target slots by this
  component: ComponentName                     // one of exactly ten
  prominence: "hero" | "standard" | "muted"    // default "standard"
  span: "full" | "half"                        // default "full"
  props: Record<string, unknown>               // validated per-component at render
  reason?: string                              // plain English, copied into trace at stage 1
}

TraceEntry = {
  stage: "base" | "context" | "signal" | "override"
  slotId: string
  action: "added"|"removed"|"moved"|"promoted"|"demoted"|"rewritten"
  reason: string                               // about the customer, never about the code
}

Rule = {
  id: string
  when: { attribute: string, equals?, greaterThan?, lessThan? }
  then: RuleAction[]                           // promote|demote|remove|add|move|rewrite
  reason: string
}
```

`ComponentNameSchema` is the single source of truth for the ten components. The
registry must have exactly these keys — TypeScript enforces it.

---

## The pipeline — `lib/resolver.ts`

One code path. `level` decides where it stops. There is no branch per persona
anywhere, and the only thing `level` does is index two lookup tables.

```
GET /api/experience/home?personaId=&level=&customerId=&signal=

  1. BASE      /config/personas/{persona}.json      → BRONZE stops here
  2. CONTEXT   /config/rules/context.json           → SILVER stops here
  3. SIGNAL    /config/rules/signals.json           → GOLD
  4. OVERRIDE  /config/overrides/{customerId}.json     ← chunk 10, not built
  5. VALIDATE  ScreenSchema.parse() — 422 on failure
  6. HYDRATE   /config/data/{persona}.json into slot props
```

```ts
const RUNS_CONTEXT: Record<Level, boolean> = { bronze: false, silver: true, gold: true  };
const RUNS_SIGNALS: Record<Level, boolean> = { bronze: false, silver: false, gold: true };
```

### Two entry points, one body

```
resolveScreen(req)   → reads the persona file from disk  ─┐
                                                          ├─→ assemble({ base, persona, level, data, signalOverrides })
previewScreen(config, personaId, level) → takes a config ─┘   from the studio editor
```

`assemble` is the pipeline. The studio's right-hand pane runs the *real*
resolver, not a parse — without that it would either be full of fallback cards
(no hydration) or fail to show what Silver and Gold do to an edit (no rules).

### Stages 2 and 3 are the same function call

```ts
// stage 2
applyRules(slots, contextRules, data.attributes, "context")
// stage 3
applyRules(slots, signalRules, { ...data.signals, ...signalOverrides }, "signal")
```

`lib/rules.ts` was written against a generic facts object in chunk 6 and reused
**unchanged** in chunk 8. Do not write a second evaluator.

### Validation happens twice, deliberately

The persona file is parsed into typed slots when it is read, so the evaluator
has something to work with. `ScreenSchema.parse` then runs again at stage 5,
after the rules have finished. A rule that inserts a malformed slot is therefore
a 422 rather than a broken card.

---

## Layout and data are separate files

This separation is a rule in `CLAUDE.md`, not a preference.

| | Holds | Example |
|---|---|---|
| `/config/personas/{id}.json` | Structure and copy — which components, what order, prominence, span, and the `reason` strings | *"a StatusCard goes here, full width"* |
| `/config/data/{id}.json` | The customer's numbers, keyed by slot id, plus `attributes`, `signals` and `demoSignals` | *"3 of 5 steps, waiting on payslips, ref AIP-88421"* |

Hydration (stage 6) merges `data.slots[slot.id]` over `slot.props`. Data wins.
A slot the data file says nothing about keeps exactly what the layout gave it.

**Never put a balance in a layout file.**

### Data file shape

```jsonc
{
  "personaId": "daniel",
  "order": 2,                       // journey order for the switcher, not alphabetical
  "customer": { "firstName": "…", "lastName": "…", "summary": "one line for the room" },
  "attributes": { … },              // durable facts — Silver reads these
  "signals": { … },                 // recent behaviour at rest — Gold reads these
  "demoSignals": [                  // what the Fire a signal button offers
    { "key": "propertiesViewedThisWeek", "label": "Daniel viewed three properties this week",
      "value": 3, "note": "He is close to making an offer." }
  ],
  "slots": { "aip-status": { … } }  // merged over layout props at stage 6
}
```

---

## The three customers

| | Maya | Daniel | Priya |
|---|---|---|---|
| Situation | Renting, saving a deposit | Deposit saved, viewing properties | Owns, considering a move |
| Mortgage with us | no | no | **yes** |
| Theme | `teal` / `spacious` / `md` | `navy` / `compact` / `md` | `plum` / `comfortable` / `md` |
| Exclusive components | — | — | `MortgageSummary`, `EquityCard` |
| Fireable signal | `aipPageOpened` | `propertiesViewedThisWeek` | `movingCostEstimateRun` |

Priya's figures are internally consistent across three components that read the
same mortgage — £412,000 property less a £198,450 balance is both the £213,550
equity `EquityCard` shows and the deposit the calculator starts from, and her
£136,550 of additional borrowing is her £335,000 limit less that same balance.
**If you change one of those numbers, change all of them.**

---

## File map

### `lib/`

| File | Lines | Role |
|---|---|---|
| `contract.ts` | 129 | The Zod schema everything hangs off |
| `resolver.ts` | 266 | The pipeline; `resolveScreen`, `previewScreen`, `assemble`, `loadData` |
| `rules.ts` | 163 | The one evaluator. Six actions, generic facts object |
| `config.ts` | 70 | Filesystem access for `/config`. Slug-checks ids before they touch a path |
| `format.ts` | 63 | `gbp`, `gbpExact`, `pct`, `monthYear`, `monthlyPayment` (annuity) |

### `components/` — the ten

`AffordabilityCalculator` (350 lines, three modes), `MortgageSummary`,
`EquityCard`, `SavingsProgressCard`, `StatusCard`, `Checklist`,
`LifeStageIntro`, `ContentCard`, `NextActionCard`, `AdviserCard`.

Each exports a Zod props schema named after itself and takes an optional
`prominence`. All are presentational — no fetching, no business logic, no
knowledge of personas or levels.

### `components/` — the machinery

| File | Role |
|---|---|
| `registry.ts` | `Record<ComponentName, RegistryEntry>` — drift is a compile error |
| `ScreenRenderer.tsx` | Walks slots in array order. No sort, no filter, no conditional |
| `SlotBoundary.tsx` | Error boundary + the fallback card a broken slot degrades to |
| `ui/Card.tsx` | The chrome prominence lives in, so it isn't reimplemented ten times |
| `ui/primitives.tsx` | `Button`, `Pill`, `Figure`, `Progress`, `Row`, `Slider` |

### `components/` — the demo chrome

`HomeExperience.tsx` (fetch + state), `DemoBar.tsx` (persona/level/signal
controls), `TracePanel.tsx` (P6), `Studio.tsx` (the config editor).

These are presenter tools, not part of the customer experience. Chunk 9's
"components consume tokens only" rule is about the ten components, not these.

---

## Design tokens — `app/globals.css`

Every token is `--u-*` on `:root`.

| Group | Tokens |
|---|---|
| Neutral surfaces | `--u-page`, `--u-surface`, `--u-surface-sunken`, `--u-ink`, `--u-ink-soft`, `--u-ink-faint`, `--u-line`, `--u-line-strong` |
| Status | `--u-positive`, `--u-positive-soft`, `--u-caution`, `--u-caution-soft` |
| **Accent** (`theme.accent`) | `--u-accent`, `--u-accent-deep`, `--u-accent-soft`, `--u-accent-line`, `--u-accent-on` |
| **Density** (`theme.density`) | `--u-gap`, `--u-pad`, `--u-pad-hero`, `--u-pad-muted`, `--u-stack` |
| **Scale** (`theme.scale`) | `--u-scale`, and `--u-text-xs` … `--u-text-3xl` derived from it via `calc()` |
| Other | `--u-radius` |

Components reference them with Tailwind arbitrary values —
`bg-[var(--u-surface)]`, `text-[length:var(--u-text-lg)]`,
`p-[var(--u-pad)]`. This is deliberate over Tailwind `@theme` indirection:
it is greppable and obvious.

**Measured state of the ten components + `ui/`:**

- raw Tailwind text-size utilities: **0** — every font size already goes through a token
- hardcoded hex colours: **0** (the only hex in `components/` is `Studio.tsx`, which is the editor's dark chrome and deliberately not themed)
- raw Tailwind spacing utilities: **66** across the twelve files, alongside 26 token references

That last line is the one thing chunk 9 has to make a judgement about. See
`REMAINING-WORK.md`.

---

## Invariants — do not break these

These map to the nine hard rules in `CLAUDE.md`. Where they are enforced:

1. **The client never decides what appears.** No `if (persona === …)` in any
   component or in `ScreenRenderer`. Persona names *do* appear in `components/`
   — but only in explanatory comments (`MortgageSummary`, `SavingsProgressCard`,
   `StatusCard`, `ScreenRenderer`). In **code**, personas exist only in the demo
   chrome (`HomeExperience`, `DemoBar`, `Studio`), where they are a string in a
   query param. Verified with:

   ```bash
   grep -rn "persona\|maya\|daniel\|priya" components/ -i | grep -v "^\S*: *//"
   ```
2. **Array order is render order.** `ScreenRenderer` must never sort or filter.
3. **No RSC in the rendering path.** `app/page.tsx` is a thin Suspense shell
   around a client component that fetches over HTTP. The tree has to be visible
   in the network tab — that is half the demo. Do not "optimise" this into a
   server component.
4. **Components are presentational.** Props in, markup out.
5. **Rules are data, not code.** If `lib/rules.ts` ever needs a branch per
   persona, something has gone wrong.
6. **One rule evaluator.** Stages 2 and 3 call the same function.
7. **No database.** JSON on disk, read fresh per request, no caching. Every API
   route sets `export const dynamic = "force-dynamic"`.
8. **Never crash the page.** Unknown component → dev placeholder, dropped in
   prod. Bad props → fallback card. Component throws → error boundary catches
   one slot. Failed refetch → last good screen stays up with the error above it.
9. **Every rule-running stage appends to `trace`.** Hydration does not — it
   changes what the numbers say, not what the screen decided, and `TraceEntry`
   has no stage for it.
