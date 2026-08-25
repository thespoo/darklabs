# Unicorn — Server-Driven UI Mortgage POC

A proof of concept in which **the server decides which components render, in what
order, with what props**. The client is a dumb renderer. Three customers see
visibly different home screens assembled from one shared component library, and
a configuration change flows through to the interface without a rebuild.

## The idea in one request

```
GET /api/experience/home?personaId=daniel&level=bronze
```

returns a layout tree — not HTML, not a page, a tree of slots:

```json
{
  "screen": "home",
  "personaId": "daniel",
  "level": "bronze",
  "theme": { "accent": "navy", "density": "comfortable", "scale": "md" },
  "slots": [
    { "id": "aip-status", "component": "StatusCard", "prominence": "standard", "span": "full", "props": { "...": "..." } }
  ],
  "trace": []
}
```

Array order *is* render order. If a component isn't in `slots`, it does not exist.
`trace[]` carries a plain-English reason for every decision the server made, so
the screen can explain itself.

## The resolver pipeline

One code path, three stopping points. `level` decides where it stops.

| Stage | Reads | Stops at |
|---|---|---|
| 1. BASE | `/config/personas/{persona}.json` | **bronze** |
| 2. CONTEXT | `/config/rules/context.json` | **silver** |
| 3. SIGNAL | `/config/rules/signals.json` | **gold** |
| 4. OVERRIDE | `/config/overrides/{customerId}.json` | |
| 5. VALIDATE | `ScreenSchema.parse()` — 422 on failure | |
| 6. HYDRATE | `/config/data/{persona}.json` into slot props | |

Silver and Gold share one rule evaluator with different inputs. Rules are data,
not code.

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

Config is read from disk fresh on every request with no caching, so editing a
file under `/config` changes the app on the next refresh — no restart, no rebuild.

## Layout

```
lib/contract.ts     the Zod schema everything hangs off — the backend/UI interface
lib/resolver.ts     the pipeline above
lib/config.ts       filesystem access for /config
app/api/experience  the route that serves a screen
config/             personas, rules, overrides and mock customer data
```

`CLAUDE.md` holds the project rules. `sdui-mortgage-poc-spec.md` is the full build
spec, and `claude-code-prompts.md` the chunk-by-chunk plan.

## Build status

- [x] **Chunk 1** — scaffold and contract
- [x] **Chunk 2** — component library
- [x] **Chunk 3** — the renderer
- [x] **Chunk 4** — Bronze, end to end
- [ ] Chunk 5 — switcher and trace panel
- [ ] Chunk 6 — Silver: context rules
- [ ] Chunk 7 — config studio
- [ ] Chunk 8 — Gold: signals
- [ ] Chunk 9 — theme tokens
- [ ] Chunk 10 — individual override
