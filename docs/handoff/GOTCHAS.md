# Gotchas and settled decisions

Traps already hit during chunks 1–8, and decisions that should not be
relitigated without the owner asking for it.

---

## Toolchain

### Zod is pinned to 3.x on purpose

`contract.ts` arrived using `z.record(z.unknown())`. In Zod 4 that signature
requires two arguments, so the file would not compile. `CLAUDE.md` says to move
the contract into place **unchanged**, so the dependency was pinned to `^3`
rather than editing the contract.

Do not upgrade to Zod 4 without a reason. If you must, `z.record` calls need a
key schema and the `.default()` inference behaviour changes.

### React props types use `z.input`, not `z.infer`

```ts
export const StatusCardProps = z.object({ title: z.string().default("…"), … });
export type  StatusCardProps = z.input<typeof StatusCardProps>;   // ← input
```

`z.infer` gives the **output** type, where `.default()` fields are required —
which makes defaulted props mandatory at every call site. `z.input` keeps them
optional, which is what a React component wants. The parsed output is still
assignable to it, so the renderer passing `schema.parse(...)` results works fine.

A `const` and a `type` may share a name in TypeScript; that is why both exports
above are legal.

### Next 16's react-hooks lint rules are strict

Two things that look normal will fail `npx eslint .`:

- **`setState` called synchronously in an effect body.** `HomeExperience` avoids
  it by deriving `loading` and `error` from whether the result in hand belongs
  to the request in flight, rather than storing them.
- **Reading `ref.current` during render.** Same file originally kept a
  "last good screen" ref; it now uses state instead.

If you need a similar pattern, derive it — don't reach for a ref.

### `next dev` rewrites `AGENTS.md`

`darklabs/AGENTS.md` is generated and re-added by `next dev`. Committing it with
your work keeps the tree clean; deleting it just recreates an uncommitted
change. `CLAUDE.md` ends with an `@AGENTS.md` import so both are picked up.

---

## Things verified, with the exact method

Useful if you need to re-verify after a change.

| Claim | How it was checked |
|---|---|
| Registry can't drift from the enum | Temporarily drop a key / add an extra / mismatch a component-schema pair, run `npx tsc --noEmit`. All three are compile errors |
| Bad config is 422, never 500 | `sed` a bad component name into a persona file, `curl` the API |
| Broken slot degrades alone | `/dev/renderer` — slots 6 and 7 are broken on purpose, slot 8 still renders |
| Switching is a client nav | Set `window.__sentinel` in the console, click a persona, check it survived |
| Stage never blanks | Load Daniel, corrupt `priya.json`, switch to Priya. Banner appears, Daniel's screen stays |
| Studio won't save a bad config | POST an invalid config to `/api/config`, then `diff` the file — byte-identical |
| Firing a signal works | `/?personaId=daniel&level=gold` then click. AIP standard → hero, education standard → muted |

Quick matrix check across all nine states:

```bash
for p in maya daniel priya; do for l in bronze silver gold; do
  printf "%-7s %-7s " "$p" "$l"
  curl -s "http://localhost:3000/api/experience/home?personaId=$p&level=$l" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d);console.log(s.slots.map(x=>x.id+'['+x.prominence[0]+']').join(' '))})"
done; done
```

---

## Design decisions already made

### One contract change was made: `Slot.reason`

`SlotSchema` gained an optional `reason: string`.

Rule 9 says every pipeline stage appends to the trace, but the base stage had
nothing to say — a Bronze screen could not explain itself, and **three of the
seven playback beats are Bronze**. Keeping the reasons in the config files
rather than in the resolver also keeps rule 5 ("rules are data, not code")
intact. Additive and optional, so nothing else had to change.

### Validation runs twice

See `ARCHITECTURE.md`. The persona file is parsed to typed slots on read; stage
5 validates the assembled result. This is a small departure from the spec's
single VALIDATE step and is strictly better — a rule that inserts a malformed
slot becomes a 422 rather than a broken card.

### Rules that no-op are silent

`applyRules` says nothing when an action targets a slot this customer's screen
does not have, and says nothing when promoting something already at that weight.
That silence is what lets one shared rule file cover three customers without any
of them knowing about the others, and stops the trace panel narrating
non-events. **Don't "fix" it by tracing attempted actions.**

### Silver deliberately leaves work for Gold

Daniel's AIP stays at `standard` and his education stays visible at Silver, even
though rules could promote and mute them there. Chunk 8's acceptance criterion
is that *firing the signal* does both. Silver must not spend Gold's payoff.

Similarly, Gold differs from Silver at rest for all three personas, so switching
to Gold is not a no-op — the fire button then adds more on top.

### Fired signals live in the URL, not on disk

`?signal=key:value`, applied over the resting values in the data file. Nothing
is written. A fired screen is therefore a link — shareable, and recoverable with
the back button if something goes wrong mid-demo. Switching customer clears
fired signals, since they belong to the person they were fired for.

### Two fired states were tuned to avoid competing heroes

Maya's and Priya's fired rules originally produced three `hero` slots at once. A
screen with three heroes has none, so those rules now demote as well as promote
— Maya's calculator steps back once she is looking at applying, Priya's current
mortgage becomes context once she is costing out a move. Keep that discipline if
you add rules.

### Rule reasons name the customer

`context.json` and `signals.json` contain reasons like *"Priya already holds a
Unicorn mortgage…"* even though the rules are generic and attribute-driven. This
follows the reference rule given verbatim in `CLAUDE.md`, and reads better on
stage. It is a demo simplification: with more than three customers these would
need rewriting in the third person.

### `/gallery` is the safety net

If the renderer breaks mid-demo, `/gallery` still shows all ten components. It
deliberately does not go through `ScreenRenderer`, and after chunk 9 it will
keep the neutral `:root` theme rather than a persona's. Both are on purpose.

---

## Open question the owner has not ruled on

**Priya's Bronze screen opens with a generic "Thinking about buying a home?"
intro**, even though the system knows she already owns.

The source documents conflict. `CLAUDE.md`'s persona brief says her Bronze
"leads with `MortgageSummary` and `EquityCard`". But chunk 6's acceptance
criterion says Silver must lead with her mortgage *where Bronze led with generic
content*, and the reference rule supplied in `CLAUDE.md` explicitly removes a
slot called `first-time-buyer-intro` — which only exists if Bronze has one.

The build follows the rule and the acceptance criterion: she has both exclusive
components at Bronze, sitting below a generic opener that Silver strips out.
Without that, beat 5 of the playback has no before-shot.

This was flagged to the owner and they did not overrule it, but they also did
not explicitly confirm it. **Worth raising before the playback, not after.** If
they want Bronze to lead with the mortgage, chunk 6's before-shot needs
re-cutting — the change is to `config/personas/priya.json` and possibly the
`existing-mortgage-holder` rule, not to any code.

---

## Environment note

The browser-automation pane used during this build intermittently reported
itself hidden after interaction, returning blank screenshots while the page
underneath was fine. That is a tooling quirk, **not an application bug** — DOM
text extraction confirmed correct rendering every time. If you hit it, navigate
again to reset the pane, or verify through `get_page_text` / JS evaluation
rather than screenshots.
