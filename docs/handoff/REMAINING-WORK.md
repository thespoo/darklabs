# Remaining work

Two chunks. Chunk 9 has real demo value; chunk 10 is an explicit stretch that
the spec says to cut without hesitation if anything else is shaky.

Working style, from `CLAUDE.md`: finish one chunk completely before starting the
next, run `npx tsc --noEmit` before declaring one done, and say so rather than
working around it silently if an acceptance criterion can't be met.

---

# Chunk 9 — Theme tokens *(~45 min)*

## The situation

`theme` is in the contract, it is in all three persona configs, and it currently
**drives nothing**. The three screens differ by which components appear and in
what order, but not by colour, density or type size.

The groundwork is already done, which is why this is a short chunk:

- Every token exists on `:root` in `app/globals.css`.
- The ten components already consume tokens for **every font size** and **every
  colour** — measured: zero raw Tailwind text utilities, zero hex.
- `--u-text-*` are already derived from `--u-scale` through `calc()`, so setting
  one variable rescales the whole type ramp.

What is missing is the one link in the chain: **nothing writes `theme.accent`,
`theme.density` and `theme.scale` onto a wrapper element.**

## What to build

A wrapper around the rendered screen that sets the themed tokens as inline CSS
custom properties, driven by `screen.theme`.

Put it in `ScreenRenderer` (or a small `ThemeScope` component it renders). That
location matters: `ScreenRenderer` receives the `Screen`, so `/` **and**
`/studio` both get themes for free, while `/gallery` keeps the `:root` defaults
and stays a neutral component reference.

```tsx
// sketch — not prescriptive
const ACCENTS: Record<Theme["accent"], Record<string, string>> = {
  teal:  { "--u-accent": "#0f5f6b", "--u-accent-deep": "#0a444d", "--u-accent-soft": "#e5f1f2", "--u-accent-line": "#b9d9dd", "--u-accent-on": "#ffffff" },
  navy:  { … },
  plum:  { … },
};

const DENSITIES: Record<Theme["density"], Record<string, string>> = {
  compact:     { "--u-gap": "0.75rem",   "--u-pad": "1rem",     "--u-pad-hero": "1.375rem", "--u-pad-muted": "0.75rem",  "--u-stack": "0.5rem"   },
  comfortable: { "--u-gap": "1.125rem",  "--u-pad": "1.375rem", "--u-pad-hero": "1.875rem", "--u-pad-muted": "1rem",     "--u-stack": "0.75rem"  },
  spacious:    { "--u-gap": "1.75rem",   "--u-pad": "2rem",     "--u-pad-hero": "2.75rem",  "--u-pad-muted": "1.375rem", "--u-stack": "1.125rem" },
};

const SCALES: Record<Theme["scale"], string> = { sm: "0.92", md: "1", lg: "1.12" };

<div style={{ ...ACCENTS[theme.accent], ...DENSITIES[theme.density], "--u-scale": SCALES[theme.scale] } as CSSProperties}>
```

The `comfortable` row above is exactly what `:root` holds today — keep it
identical so nothing shifts for Priya.

`teal` is the current `:root` accent, so Maya is already correct. **`navy` and
`plum` need palettes choosing.** They must clear contrast against
`--u-accent-on: #ffffff` for button text, and `--u-accent-soft` is used as a
pale background behind `--u-accent-deep` text, so that pair needs to work too.

## The judgement call you have to make

The ten components use **66 raw Tailwind spacing utilities** (`p-4`, `mt-2`,
`gap-3` …) alongside 26 token references. Card padding, grid gap and the
vertical stack rhythm are already tokenised; inner details are not.

The acceptance criterion is *"changing `theme.density` visibly changes spacing
across every component without any component code being touched."*

- **Minimum honest pass:** the wrapper alone. Card padding, grid gap and stack
  spacing all shift, which is visible across every component. Inner details stay
  fixed.
- **Full pass:** also convert the 66 raw utilities to token-based spacing.

Do the minimum first, look at it, and only convert the raw utilities if the
change reads as too subtle from across a room. Do not convert them all
mechanically before you have seen whether it is needed — most of that 66 is
`mt-0.5` and `gap-2` on things like pill rows, where density scaling would look
wrong rather than better.

## Acceptance

> Changing `theme.density` from `"comfortable"` to `"spacious"` in a config file
> visibly changes spacing across all ten components without any component code
> being touched.

**How to verify.** Priya is `comfortable`; edit `config/personas/priya.json` to
`"spacious"`, refresh, and compare. Better still, do it in `/studio` — the right
pane should reflow live, which is a nice extra beat for the playback. Also check
all three personas now render in distinguishably different accents, since that
is the visible payoff.

```bash
# the three themes currently in play
grep -h '"theme"' config/personas/*.json
```

Watch for: the `NextActionCard` hero takeover and the `AffordabilityCalculator`
result panels paint accent backgrounds with reversed text — check those in navy
and plum specifically, not just the default teal.

---

# Chunk 10 — Individual override *(stretch)*

## The situation

Stage 4 is a comment in `assemble`. Two specific things are half-wired:

1. `customerId` is parsed by `app/api/experience/home/route.ts`, passed into
   `resolveScreen`, and declared on `ResolveRequest` — but `resolveScreen` does
   **not destructure it** and does not pass it to `assemble`. You need to thread
   it through, the same way `signalOverrides` already is.
2. `config/overrides/` is now tracked (via a `.gitkeep`) but **empty**. Put a
   real override file in it — nothing reads the directory yet.

## What to build

`/config/overrides/{customerId}.json` — a partial slot list merged onto the
resolved screen by slot id, supporting reorder and removal. Applied when a
`customerId` query param matches a file. Every change appends a trace entry at
stage `"override"`.

Two ways to do it, and the second is better:

- Write bespoke merge logic for stage 4.
- **Express the override as a `RuleSet` and run it through `applyRules` with
  stage `"override"`.** The evaluator already supports `promote`, `demote`,
  `remove`, `add`, `move` and `rewrite`; `TraceEntry` already has an
  `"override"` stage; and `RuleStage` in `lib/rules.ts` already includes it. A
  third caller of the same function is much more in keeping with rule 6 than a
  fourth mechanism.

If you take the second route, the override file is a `RuleSet` whose conditions
are trivially true — or give `applyRules` a way to run unconditionally. Either
is fine; say which you chose in the commit message.

## Notes

- The `add` action is implemented and typed but **not exercised by any config
  file**. An override is the natural place to use it, which would close that gap.
- Override reasons go in the trace like any other, in the same voice: about the
  customer, never about the code. Something like *"Daniel asked us to stop
  showing him the deposit tracker, so it has been removed from his screen."*
- Create the override for a named Daniel, per the spec, and demo it as *persona
  base, then the same persona with the override*.
- `assertSafeId` already exists in `lib/config.ts` — use it on `customerId`
  before it touches a file path.
- A missing override file must be a silent no-op, not a 404. Most requests will
  not have one.

## Acceptance

> One override file for a named customer, applied by URL param. Shows persona
> base, then the same persona with the override.

---

# Optional polish, if time allows

Not required, roughly in order of value:

1. **Rehearse the playback end to end** on the machine it will be presented
   from, before anything else. The spec is explicit that the demo failing on
   stage is a bigger risk than any missing feature.
2. **Priya's Bronze opener** — see the open question in `GOTCHAS.md`. It is a
   deliberate reading of a contradiction in the source documents and the owner
   has not yet ruled on it. Worth raising before the playback rather than after.
3. **A signal rule using `add`** — the only rule action no config exercises.
4. **`/studio` fires signals** — `previewScreen` already accepts
   `signalOverrides`, but `app/api/experience/preview/route.ts` does not parse
   or forward them. Small gap, would let the studio show Gold properly.
5. **Mobile** — the layout is mobile-first by default but has not been checked
   below 768px. Out of scope per the spec, but worth a glance if the playback
   might happen on a tablet.
