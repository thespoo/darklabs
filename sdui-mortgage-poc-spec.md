# Unicorn — Server-Driven UI Mortgage POC
## Build spec for Claude Code

**Deadline: 4pm playback, same day.**

**Goal:** one shared component library, a configuration layer, and three visibly different customer experiences assembled from the same components. A configuration change flows through to the interface without a rebuild.

---

## 1. What the playback must prove

Taken directly from the brief. These are the acceptance criteria for the day — every work chunk below traces to one of them.

| # | Proof point | Delivered by |
|---|---|---|
| P1 | One shared set of components | Chunk 2 |
| P2 | Configuration assembles three visibly different experiences | Chunk 4 |
| P3 | A config change updates the screen without rebuilding it | Chunk 7 |
| P4 | Known context can select or reorder components | Chunk 6 (Silver) |
| P5 | An illustrative signal can alter prominence or next action | Chunk 8 (Gold) |
| P6 | The team can explain why each change helps the customer | The `trace` array — see §5 |

P6 is the one teams forget to build for. It's handled architecturally here, not left to the presenter's memory.

---

## 2. Decisions locked

| Decision | Choice |
|---|---|
| SDUI depth | Full layout tree — server picks components, order, props |
| Stack | Next.js (App Router), TypeScript, Tailwind, Zod. Single repo. |
| Backend | Next.js API routes reading JSON config from disk, no database |
| Screens | One home screen per persona, assembled from shared components |
| Maturity levels | Bronze / Silver / Gold as three stages of one resolver pipeline |
| Component library | 6 substantive components + 4 simple cards = the 10 in the brief |
| Personalisation axes | Which components appear · order and prominence · theme |
| Auth state | All three personas are logged-in Unicorn customers |
| Config editing | Split-screen: JSON editor left, live app right |

**Deliberate constraint:** do *not* use React Server Components for the rendering path. The client fetches a JSON layout tree over HTTP and renders it. The SDUI story has to be visible in the network tab — that's half the demo.

---

## 3. The three customers

All three are existing Unicorn customers at different stages of one home-buying journey. What differs is what Unicorn already knows about them, which is a far stronger personalisation axis than demographics.

### Maya — preparing to buy her first home
Renting, saving for a deposit. Doesn't know what she can afford, what costs to expect, or what to do first. **Needs guidance and confidence, not an application.**

> As a customer preparing to buy my first home, I want to understand what I may be able to afford and the steps involved, so that I can make progress without feeling that I need to apply immediately.

- **Known context:** rents rather than holds a mortgage; regular savings activity; has not previously used the affordability calculator
- **Should leave knowing:** roughly where she stands, her next sensible step, how to become more prepared, and that Unicorn can help *before* she is ready to apply
- **Bronze:** education, affordability and deposit-building prioritised
- **Silver:** affordability and deposit support placed first, rather than leading with an application
- **Gold:** repeated calculator use simplifies the introductory content, shows an updated affordability position, and raises the agreement in principle / adviser conversation

### Daniel — actively looking for a home
Deposit saved, viewing properties. Needs to know whether Unicorn will lend enough and what to do before making an offer. **Needs speed, reassurance and a clear route in.**

> As a customer actively looking for a home, I want to quickly confirm my likely borrowing position and get mortgage-ready, so that I can make an offer with greater confidence.

- **Known context:** completed an affordability calculation; already started an agreement in principle; returned to the mortgage area several times
- **Should be able to:** understand his indicative borrowing position, continue or revisit his AIP, see practical next steps, speak to someone if things are complex
- **Bronze:** AIP, affordability result and next steps ahead of general educational content
- **Silver:** lets him *continue* rather than repeatedly treating him as new
- **Gold:** AIP status to the top, missing information highlighted, most relevant action made prominent, generic content he's already seen reduced

Daniel is the clearest illustration that adaptation is about **timing and relevance**, not personalising a name.

### Priya — an existing homeowner considering a move
Has a Unicorn mortgage, considering a larger home. Wants to know what happens to her existing mortgage, what she could borrow, and whether moving is affordable. **Needs the experience to recognise the existing relationship.**

> As an existing mortgage customer considering a move, I want to understand how my current mortgage and available equity affect my options, so that I can decide whether moving home is realistic.

- **Known context:** already has a Unicorn mortgage with a balance and current deal; recently used a borrowing calculator
- **Should be able to:** see her current mortgage position, understand the role of equity, explore additional borrowing, understand the implications of moving, get help with a complex decision
- **Bronze:** home mover screen combining shared components with current-mortgage and equity components
- **Silver:** starts with her existing position rather than generic first-time buyer content
- **Gold:** equity and options foregrounded, moving-home affordability prioritised, adviser conversation offered, irrelevant content reduced

Priya gets components the other two structurally cannot have. That's the most defensible personalisation story in the room.

---

## 4. The contract

Everything hangs off one schema. Build this first — it's the interface between backend and component library, and it's what stops a bad config from silently rendering a blank screen.

```ts
// lib/contract.ts
import { z } from "zod";

export const LevelSchema = z.enum(["bronze", "silver", "gold"]);

export const ThemeSchema = z.object({
  accent: z.enum(["teal", "navy", "plum"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
  scale: z.enum(["sm", "md", "lg"]),
});

export const ComponentNameSchema = z.enum([
  // 6 substantive
  "AffordabilityCalculator",
  "MortgageSummary",
  "EquityCard",
  "SavingsProgressCard",
  "StatusCard",
  "Checklist",
  // 4 simple cards
  "LifeStageIntro",
  "ContentCard",
  "NextActionCard",
  "AdviserCard",
]);

export const SlotSchema = z.object({
  id: z.string(),                                   // stable key, e.g. "aip-status"
  component: ComponentNameSchema,
  prominence: z.enum(["hero", "standard", "muted"]).default("standard"),
  span: z.enum(["full", "half"]).default("full"),
  props: z.record(z.unknown()),                     // validated per-component at render
});

export const TraceEntrySchema = z.object({
  stage: z.enum(["base", "context", "signal", "override"]),
  slotId: z.string(),
  action: z.enum(["added", "removed", "moved", "promoted", "demoted", "rewritten"]),
  reason: z.string(),                               // human-readable, shown in the demo
});

export const ScreenSchema = z.object({
  screen: z.literal("home"),
  personaId: z.string(),
  level: LevelSchema,
  version: z.string(),
  theme: ThemeSchema,
  slots: z.array(SlotSchema),                       // ORDER IS THE PRIORITY
  trace: z.array(TraceEntrySchema),                 // why the screen looks like this
});

export type Screen = z.infer<typeof ScreenSchema>;
```

**Rules for the renderer:**
- Array order *is* render order. No sorting on the client.
- The client never decides whether a component appears. Not in `slots` means it doesn't exist.
- `prominence` is how Gold works. Signals rarely add components; they promote and demote existing ones.
- Unknown component name → visible dev placeholder, dropped in prod. Never crash the page.
- Each component exports its own props schema. The renderer validates and renders a fallback card on mismatch.

---

## 5. The resolver pipeline

This is the heart of the build and the thing that makes Bronze/Silver/Gold coherent rather than three separate demos. **One pipeline, three stopping points.**

```
GET /api/experience/home?personaId=maya&level=silver&customerId=cust-8842

  1. BASE      load /config/personas/maya.json           → stop here for BRONZE
  2. CONTEXT   apply rules over known customer attributes → stop here for SILVER
  3. SIGNAL    re-weight prominence from behavioural signals → GOLD
  4. OVERRIDE  merge individual customer override, if any
  5. VALIDATE  ScreenSchema.parse() — throw loudly, 422 with the Zod error
  6. HYDRATE   inject data from /config/data/{persona}.json into slot props
```

Every stage appends to `trace[]`. So the response doesn't just say *what* the screen is, it says *why*:

```json
{ "stage": "signal", "slotId": "aip-status", "action": "promoted",
  "reason": "Third visit to the mortgage area this week — Daniel is close to making an offer." }
```

**Build a debug panel that renders `trace` as plain English.** It costs twenty minutes and it directly delivers P6 — the presenter reads the reasons off the screen instead of remembering them. It is the single highest-value-per-minute thing in this spec.

Read config files per request with no caching. That's what makes live editing work without a restart, and it costs nothing at this scale.

### Rules format

Keep rules as data, not code, or you lose the "configuration drives this" claim:

```json
{
  "id": "existing-mortgage-holder",
  "when": { "attribute": "hasMortgage", "equals": true },
  "then": [
    { "action": "promote", "slotId": "mortgage-summary", "to": "hero" },
    { "action": "remove", "slotId": "first-time-buyer-intro" }
  ],
  "reason": "Priya already holds a Unicorn mortgage, so her existing position leads."
}
```

Signal rules use the identical shape, reading from a `signals` object instead of `attributes`. Same evaluator, two inputs — do not write it twice.

---

## 6. Component library

Ten components, as the brief specifies. Six carry real logic; four are simple cards and will take under fifteen minutes each. Frame it that way when scoping — "ten components" sounds like a week and isn't.

### Substantive (6)

| Component | Purpose | Key props | Personas |
|---|---|---|---|
| `AffordabilityCalculator` | Interactive borrowing estimate | `mode: "explore" \| "confirm" \| "moving"`, `income`, `deposit`, `maxBorrowing?`, `monthlyIllustration?` | All three, different modes |
| `MortgageSummary` | Current mortgage: balance, rate, remaining term, current deal | `balance`, `rate`, `termRemaining`, `dealEnds`, `portable` | Priya only |
| `EquityCard` | Estimated equity and additional borrowing | `propertyValue`, `mortgageBalance`, `estimatedEquity`, `additionalBorrowing?` | Priya only |
| `SavingsProgressCard` | Progress toward a deposit target | `label`, `current`, `target`, `monthlyContribution` | Maya (hero), Daniel (near-complete) |
| `StatusCard` | AIP or application status | `status: "not_started" \| "in_progress" \| "complete" \| "expired"`, `completedSteps`, `totalSteps` | Daniel (hero), Priya |
| `Checklist` | Home-buying steps or document checklist | `variant: "buying" \| "documents"`, `items[]` with done state | Maya (buying), Daniel (documents) |

### Simple cards (4)

| Component | Purpose | Key props |
|---|---|---|
| `LifeStageIntro` | Life-stage framing and orientation | `headline`, `body`, `illustration` |
| `ContentCard` | Educational content links | `items[]`, `layout: "list" \| "cards"` |
| `NextActionCard` | The primary next action | `headline`, `body`, `ctaLabel`, `emphasis` |
| `AdviserCard` | Speak to a mortgage adviser | `headline`, `availability`, `ctaLabel` |

All are presentational. No data fetching, no business logic, no knowledge of personas or levels.

**`AffordabilityCalculator` in three modes doing genuinely different work is the strongest single artefact in the demo.** It proves the server drives *behaviour*, not just visibility. Give it the most polish time.

---

## 7. Config structure

```
/config
  /personas
    maya.json          # base layout tree — Bronze
    daniel.json
    priya.json
  /rules
    context.json       # Silver — rules over known attributes
    signals.json       # Gold — rules over behavioural signals
  /overrides
    cust-8842.json     # individual overrides, merged by slot id
  /data
    maya.json          # mock accounts, balances, mortgage, signals
    daniel.json
    priya.json
```

**Mock data:** different per persona — they're logged-in customers with genuinely different holdings. Priya's mortgage record must be real enough to drive `MortgageSummary` and `EquityCard` together (property value, balance, and the equity that falls out of the two).

---

## 8. Work chunks

Ordered so you can stop after any chunk and still have something to show at 4pm. Timings assume a small team working in parallel after chunk 1.

### Chunk 1 — Scaffold and contract *(~45 min)*
Next.js App Router, TypeScript, Tailwind, Zod. `lib/contract.ts` per §4. One placeholder persona config and `/api/experience/home` returning it, validated.

**Done when:** the API returns valid JSON in a browser, and corrupting the config returns a 422 with a readable error.

*Everything else depends on this. One person, no parallelism, get it right.*

### Chunk 2 — Component library *(~2 hrs, parallelisable)* → **P1**
All ten components, presentational, each exporting a props schema. A `/gallery` route rendering every component in every variant with dummy props.

**Done when:** `/gallery` shows all ten and looks polished. This route is also the safety net — if the renderer breaks mid-demo, you still have something.

*Split the six substantive across the team; one person takes all four simple cards.*

### Chunk 3 — The renderer *(~60 min)*
`ComponentRegistry` mapping schema names to components. `<ScreenRenderer screen={...} />` walks `slots` in order, applies `prominence` styling, validates props per component. Unknown component → dev placeholder. Prop mismatch → fallback card, never a crash.

**Done when:** a hand-written layout tree renders the right components in the right order with the right prominence.

### Chunk 4 — Bronze, end to end *(~75 min)* → **P2**
Three persona configs, three data files. Wire `/` to fetch and render.

**Done when:** changing `?personaId=` produces three visibly different screens. **This is the core demo — protect this time above everything else.**

### Chunk 5 — Persona and level switcher *(~45 min)*
Header controls: three personas × three levels. Switching refetches and re-renders, no page reload. Plus the `trace` debug panel in plain English.

**Done when:** you can move through nine states and read aloud why each screen looks the way it does. **The trace panel is what delivers P6 — don't cut it.**

### Chunk 6 — Silver: context rules *(~75 min)* → **P4**
Rules evaluator per §5. Write `context.json` covering the known-context bullets for all three personas. Silver stops the pipeline after stage 2.

**Done when:** Priya's Silver screen leads with her mortgage position where Bronze led with generic content, and the trace explains why.

### Chunk 7 — Config studio *(~75 min)* → **P3**
`/studio` route. Split screen: JSON editor left, live-rendered app right. Debounced validate-and-render on keystroke, Zod errors inline. Save writes the file back via POST.

**Done when:** reordering two slots in the editor reorders the live app, and a syntax error shows a helpful message rather than a blank pane.

### Chunk 8 — Gold: signals *(~60 min)* → **P5**
Same evaluator, `signals.json`, reading a `signals` object from persona data. A "fire signal" button in the demo toolbar that flips a signal and refetches.

**Done when:** clicking *Daniel viewed three properties this week* promotes his AIP status to hero, demotes educational content, and writes a readable reason into the trace.

*The brief specifies signals as illustrative. Toggling a scripted signal is a legitimate and sufficient demonstration — do not build behavioural tracking.*

### Chunk 9 — Theme tokens *(~45 min)*
`theme` maps to CSS custom properties on a wrapper: accent, density, type scale. Components consume tokens only, never hardcoded colours.

**Done when:** changing `theme.density` in a config visibly changes spacing across every component without touching component code.

### Chunk 10 — Individual override *(stretch)*
One override file for a named customer, applied by URL param. Shows persona base, then the same persona with the override.

**Cut without hesitation** if 1–8 aren't solid.

---

## 9. Playback script

1. **Maya, Bronze.** Education first, deposit progress, no application pressure. "This is configuration, not code."
2. **Daniel, Bronze.** Same components, reassembled. AIP and borrowing lead, education recedes.
3. **Priya, Bronze.** Components the other two structurally cannot have, because she holds a mortgage with us.
4. **Network tab.** "None of this is in the client. The server sent this tree."
5. **Priya, Bronze → Silver.** Her existing position moves to the top. Read the reason off the trace panel.
6. **Daniel, Silver → Gold.** Fire the signal. AIP jumps to hero, seen-it content fades. "Adaptation is about timing, not about using someone's first name."
7. **`/studio`.** Reorder a slot live. "No deploy, no release, no app store."

Seven beats, roughly six minutes. Rehearse it once at 3:30 — the demo failing on stage is a bigger risk than any missing feature.

---

## 10. Risks and cuts

- **Chunk 2 is where the day gets eaten.** Ten polished components is the whole budget if you let it be. Four of them are static cards — build those in fifteen minutes each and put the time into `AffordabilityCalculator`.
- **The studio (chunk 7) is impressive but fiddly.** If it's fighting you after an hour, fall back to editing the JSON file and refreshing. P3 still passes; live-update is a flourish.
- **Do not let anyone introduce a database.** JSON on disk is the correct architecture here and makes chunks 6, 7 and 8 trivial.
- **Do not build two rule evaluators.** Silver and Gold use the same code with different inputs. Writing it twice costs an hour you don't have.
- **Watch for Gold creep.** "Predictive signals" invites someone to propose a model. The brief says *illustrative*. A toggle is the deliverable.

## 11. Explicitly out of scope

Real auth, real product data, real affordability logic beyond a plausible formula, actual behavioural tracking or prediction, accessibility audit, responsive polish beyond mobile-first defaults, config persistence beyond the local filesystem, analytics, the Apply screen.
