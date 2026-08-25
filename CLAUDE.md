# Unicorn SDUI Mortgage POC — project rules

Read this before every task. These decisions are settled. Do not revisit them, propose alternatives, or "improve" them mid-build. We have until 4pm today.

## What this is

A server-driven UI proof of concept. The **server** decides which components render, in what order, with what props. The client is a dumb renderer. Three customers see visibly different screens assembled from one shared component library.

## Hard rules

1. **The client never decides what appears.** If a component isn't in the `slots` array, it does not render. No client-side filtering, no conditional rendering based on persona, no `if (persona === 'maya')` anywhere in component code.
2. **Array order is render order.** Never sort `slots` on the client.
3. **No React Server Components in the rendering path.** The page must fetch a JSON tree over HTTP so the payload is visible in the network tab. This is a demo requirement, not a technical one.
4. **Components are presentational.** No data fetching, no business logic, no knowledge of personas, levels, or signals. They take props and render.
5. **Rules are data, not code.** Context and signal rules live in JSON. If you find yourself writing `if` statements per persona in the resolver, stop — you have broken the central claim of the demo.
6. **One rule evaluator.** Silver (context) and Gold (signals) use the same evaluator with different inputs. Do not write it twice.
7. **No database.** JSON files on disk, read fresh per request, no caching. This is what makes live config editing work.
8. **Never crash the page.** Unknown component → visible placeholder in dev, dropped in prod. Prop validation failure → fallback card. A blank screen mid-demo is the worst outcome available.
9. **Every pipeline stage appends to `trace`.** Human-readable reasons, written for a stakeholder audience, not for developers.

## Stack

Next.js (App Router), TypeScript, Tailwind, Zod. Single repo. No other dependencies without asking.

## The resolver pipeline

```
GET /api/experience/home?personaId=&level=&customerId=

1. BASE      load /config/personas/{persona}.json      → BRONZE stops here
2. CONTEXT   apply /config/rules/context.json          → SILVER stops here
3. SIGNAL    apply /config/rules/signals.json          → GOLD
4. OVERRIDE  merge /config/overrides/{customerId}.json
5. VALIDATE  ScreenSchema.parse() — throw 422 with the Zod error
6. HYDRATE   inject /config/data/{persona}.json into slot props
```

`level` decides where the pipeline stops. It is one code path, not three.

## The ten components

Six substantive: `AffordabilityCalculator`, `MortgageSummary`, `EquityCard`, `SavingsProgressCard`, `StatusCard`, `Checklist`.

Four simple cards: `LifeStageIntro`, `ContentCard`, `NextActionCard`, `AdviserCard`.

Do not add components. Do not rename them — the names are in the Zod enum and in every config file.

## The three customers

- **Maya** — renting, saving a deposit, doesn't know what she can afford. Needs guidance, not an application. No mortgage. Bronze leads with education and deposit progress.
- **Daniel** — deposit saved, viewing properties, started an AIP. Needs speed and a borrowing figure. No mortgage yet. Bronze leads with AIP status and affordability.
- **Priya** — existing Unicorn mortgage, considering moving to a larger home. Needs her existing position surfaced. Bronze leads with `MortgageSummary` and `EquityCard`, which the other two cannot have.

## Reference config shape

`/config/personas/daniel.json` — match this shape exactly:

```json
{
  "screen": "home",
  "personaId": "daniel",
  "level": "bronze",
  "version": "1.0.0",
  "theme": { "accent": "navy", "density": "comfortable", "scale": "md" },
  "slots": [
    {
      "id": "aip-status",
      "component": "StatusCard",
      "prominence": "standard",
      "span": "full",
      "props": { "status": "in_progress", "completedSteps": 3, "totalSteps": 5 }
    },
    {
      "id": "affordability",
      "component": "AffordabilityCalculator",
      "prominence": "standard",
      "span": "full",
      "props": { "mode": "confirm" }
    },
    {
      "id": "document-checklist",
      "component": "Checklist",
      "prominence": "standard",
      "span": "half",
      "props": { "variant": "documents" }
    },
    {
      "id": "next-action",
      "component": "NextActionCard",
      "prominence": "standard",
      "span": "half",
      "props": {
        "headline": "Continue your agreement in principle",
        "body": "You're three steps from a decision.",
        "ctaLabel": "Continue",
        "emphasis": "high"
      }
    },
    {
      "id": "adviser",
      "component": "AdviserCard",
      "prominence": "muted",
      "span": "full",
      "props": { "headline": "Talk it through", "availability": "Today until 8pm", "ctaLabel": "Book a call" }
    }
  ],
  "trace": []
}
```

Values that come from customer data (balances, borrowing figures, checklist items) are injected at stage 6 from `/config/data/{persona}.json`. Keep them out of the persona layout files — layout and data are separate concerns.

## Reference rule shape

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

Supported actions: `promote`, `demote`, `remove`, `add`, `move`, `rewrite`. The `reason` string is shown to stakeholders — write it in plain English about the customer, never about the code.

## Working style

- Finish one chunk completely before starting the next. Stop and report at each chunk boundary.
- Run `npx tsc --noEmit` before declaring a chunk done.
- If a chunk's acceptance criterion can't be met, say so rather than working around it silently.
- Prefer boring, obvious code. This is thrown away tomorrow. No abstractions that pay off later — there is no later.

---

@AGENTS.md
