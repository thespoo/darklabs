# Claude Code prompts — one per chunk

## Before you start

1. Create an empty directory and open Claude Code in it.
2. Drop `CLAUDE.md` and `sdui-mortgage-poc-spec.md` in the root. Put `contract.ts` alongside them for now — chunk 1 moves it into place.
3. Paste chunks one at a time. **Do not paste ahead.** Let each finish and check the acceptance criterion yourself before moving on.

If Claude Code starts drifting — inventing components, adding libraries, writing persona logic into the client — say *"re-read CLAUDE.md, you've broken rule N"* and it'll snap back. That's what the file is for.

---

## Chunk 1 — Scaffold and contract *(~45 min)*

```
Read CLAUDE.md and sdui-mortgage-poc-spec.md first.

Scaffold a Next.js App Router project with TypeScript and Tailwind in this
directory. Then:

1. Move the provided contract.ts to lib/contract.ts, unchanged.
2. Create /config/personas/daniel.json using the reference shape in CLAUDE.md.
3. Create an API route at /api/experience/home that reads the persona config
   from disk based on a personaId query param, validates it with ScreenSchema,
   and returns it as JSON. No caching — read the file fresh on every request.
4. On validation failure, return a 422 with the formatted Zod error in the body.

Do not build any components or pages yet. Do not add dependencies beyond
next, react, typescript, tailwind and zod.

Done when: hitting /api/experience/home?personaId=daniel in a browser returns
valid JSON, and deliberately corrupting daniel.json returns a 422 with a
readable error rather than a 500.

Run npx tsc --noEmit and confirm it passes before reporting back.
```

---

## Chunk 2 — Component library *(~2 hrs)*

Paste this as one prompt, but expect to work through it in passes. If you have a team, this is where you split — one person on the six substantive components, one on the four cards, one continues to chunk 3.

```
Build all ten components in components/, per the table in section 6 of the spec.

Rules:
- Every component is presentational. Props in, JSX out. No fetching, no
  business logic, no knowledge of personas or levels.
- Every component exports a Zod props schema alongside it, e.g.
  export const AffordabilityCalculatorProps = z.object({ ... })
- Every component accepts a `prominence` prop ("hero" | "standard" | "muted")
  and visibly changes weight accordingly — hero is larger with more emphasis,
  muted is quieter and smaller.
- Tailwind only. No component libraries.

Then build a /gallery route that renders every component in every variant
with realistic dummy props, labelled.

Give AffordabilityCalculator the most attention: its three modes
(explore / confirm / moving) should do genuinely different things, not just
show different copy. Explore is an open-ended slider-driven estimate for
someone who doesn't know where to start. Confirm shows a specific indicative
borrowing figure with a monthly payment illustration. Moving accounts for an
existing mortgage balance and equity.

Done when: /gallery shows all ten components, all variants, all three
prominence levels, and looks like something you'd show a bank.
```

---

## Chunk 3 — The renderer *(~60 min)*

```
Build the client renderer.

1. components/registry.ts — a map from ComponentName to the component and its
   props schema. It must have exactly the ten keys in the ComponentNameSchema
   enum; make TypeScript enforce this.
2. components/ScreenRenderer.tsx — takes a validated Screen, walks slots in
   array order, and renders each one. Applies prominence and span.
3. Per-slot resilience: validate slot.props against that component's schema.
   On failure, render a small fallback card naming the component and the
   validation error. On an unknown component name, render a visible dev
   placeholder. Never throw, never blank the page.

Do not sort, filter, or conditionally hide slots. Array order is render order.

Done when: a hand-written Screen object in a test file renders the right
components in the right order at the right prominence, and deliberately
breaking one slot's props degrades only that slot.
```

---

## Chunk 4 — Bronze, end to end *(~75 min)* — **the core demo, protect this time**

```
Make Bronze work for all three personas.

1. Write /config/personas/maya.json and priya.json alongside daniel.json.
   Use the persona briefs in section 3 of the spec. The three must be
   visibly different — different components, different order, different
   theme. Priya must include MortgageSummary and EquityCard; Maya must not.
2. Write /config/data/{maya,daniel,priya}.json with mock customer data:
   balances, savings, borrowing figures, checklist items, and for Priya a
   full mortgage record (balance, rate, term remaining, deal end date,
   property value) with enough detail that EquityCard can compute equity.
3. Add the HYDRATE stage to the resolver: inject data from the data file
   into slot props before returning.
4. Wire the home page at / to fetch from the API and render with
   ScreenRenderer.

Done when: /?personaId=maya, ?personaId=daniel and ?personaId=priya produce
three screens that are obviously, visibly different to someone who knows
nothing about the project.
```

---

## Chunk 5 — Switcher and trace panel *(~45 min)*

```
1. A header control with three personas and three levels (bronze/silver/gold).
   Switching either refetches and re-renders with no page reload. Level does
   nothing yet beyond passing through — that's fine.
2. Under each persona, a one-line caption of who they are, so the room knows
   who they're looking at.
3. A collapsible debug panel that renders the screen's `trace` array as plain
   English: stage, what changed, and the reason. Style it so it reads as a
   narration of the server's decisions, not as developer output.

The trace panel is a demo deliverable, not a dev tool. It's what lets the
presenter explain why each screen looks the way it does. Make it legible
from the back of a room.
```

---

## Chunk 6 — Silver: context rules *(~75 min)*

```
Build the rules evaluator and the context stage.

1. lib/rules.ts — evaluates a RuleSet (see contract.ts) against an attributes
   object. Supports the six actions: promote, demote, remove, add, move,
   rewrite. Every rule that fires appends a TraceEntry with its reason string.
2. Add `attributes` to each persona's data file, per the known-context bullets
   in section 3 of the spec: Maya rents, has regular savings, hasn't used the
   calculator. Daniel has completed affordability, started an AIP, has
   returned several times. Priya has a mortgage, a balance and deal, recently
   used a borrowing calculator.
3. /config/rules/context.json — rules covering those attributes.
4. Wire stage 2 of the pipeline. level=silver runs stages 1-2, level=bronze
   runs stage 1 only. One code path.

This evaluator will be reused unchanged for Gold in chunk 8. Write it against
a generic input object, not against "attributes" specifically.

Done when: Priya at silver leads with her mortgage position where bronze led
with generic content, and the trace panel explains why in a sentence a
stakeholder would understand.
```

---

## Chunk 7 — Config studio *(~75 min)*

```
Build /studio: a split screen with a JSON editor on the left and the live
rendered app on the right.

- The editor holds the persona config as text. On keystroke (debounced ~300ms),
  parse and validate it, and re-render the right pane.
- Zod errors show inline in the editor pane. A syntax error must never blank
  the right pane — keep showing the last valid render with a warning.
- A Save button POSTs to /api/config and writes the file back to disk.
- A plain textarea is acceptable. Only reach for CodeMirror if everything else
  is done.

Done when: reordering two slots in the editor reorders the live app within a
second, and mistyping a component name shows a helpful message rather than
breaking the page.
```

---

## Chunk 8 — Gold: signals *(~60 min)*

```
Add the signal stage using the SAME evaluator from chunk 6. Do not write a
second one.

1. Add a `signals` object to each persona's data file — e.g. for Daniel:
   propertiesViewedThisWeek, mortgageAreaVisits, aipStarted. For Maya:
   calculatorUses. For Priya: borrowingCalculatorUses.
2. /config/rules/signals.json — rules that mostly promote and demote rather
   than add. Per the spec: Daniel's AIP status to hero and seen-before
   educational content to muted when he's close to an offer. Maya's intro
   simplified and her AIP call-to-action raised after repeated calculator use.
   Priya's equity and moving affordability foregrounded.
3. Wire stage 3. level=gold runs stages 1-3.
4. A "fire signal" control in the demo toolbar that flips a signal value and
   refetches, so the change can be triggered live on stage.

Signals are illustrative and scripted. Do not build behavioural tracking or
anything predictive. A toggle is the deliverable.

Done when: firing Daniel's signal visibly promotes his AIP status and demotes
educational content, with a readable reason in the trace.
```

---

## Chunk 9 — Theme tokens *(~45 min)*

```
Make the theme block in the schema actually drive the UI.

Map theme.accent, theme.density and theme.scale to CSS custom properties on a
wrapper element around the rendered screen. Every component consumes those
tokens — no hardcoded colours, spacing or font sizes anywhere in components/.

Done when: changing theme.density from "comfortable" to "spacious" in a config
file visibly changes spacing across all ten components without any component
code being touched.
```

---

## Chunk 10 — Individual override *(stretch — cut freely)*

```
Add stage 4 of the pipeline: individual overrides.

/config/overrides/{customerId}.json contains a partial slot list merged onto
the resolved screen by slot id, supporting reorder and removal. Applied when a
customerId query param matches a file. Every change appends a trace entry at
stage "override".

Create one override for a named Daniel to demonstrate it.
```

---

## Checkpoints

- **11:00** — chunks 1–3 done. If the renderer isn't working, drop chunk 9 and 10 now.
- **13:00** — chunk 4 done. This is the fallback demo. If you're behind here, stop adding and start polishing what exists.
- **15:00** — feature freeze regardless of what's finished.
- **15:30** — rehearse the playback script once, end to end, on the machine you'll present from.
