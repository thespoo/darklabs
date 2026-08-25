# Aurora — Dark Glass & Gold

Applies the Aurora design system to this POC by **re-valuing the existing
`--u-*` tokens**. Every token name is unchanged, so the ten components,
the registry, the configs and the resolver are all untouched by the
restyle.

Two commits, deliberately separable:

1. **The design system.** `app/globals.css` only. Zero component changes.
2. **Chunk 9.** Adds `ThemeScope` and wraps the slot tree in
   `ScreenRenderer` (a five-line diff), so `theme` from the resolver
   actually drives the screen.

Take the first without the second if you only want the look.

## Why a token re-value rather than new components

The ten components already reference tokens for every colour and font
size. That made restyling the whole app a matter of changing what the
tokens mean. The one thing that does not come across for free is the
frosted glass *material*, which is handled by the hook below.

## The glass hook

Components paint surfaces with `bg-[var(--u-surface)]`, which Tailwind
compiles to a literal class inside `@layer utilities`. The stylesheet
attaches `backdrop-filter` and the elevation shadow to that exact class
from **unlayered** CSS, which wins the cascade without `!important`.

It sets three properties, adds no pseudo-elements and changes no
positioning, so it cannot disturb an existing layout. `--u-surface` is
now deliberately translucent — that is what gives the blur something to
work with. If a surface should not be glass, give it a different token.

## What each axis does

| Axis | Values | Effect |
|---|---|---|
| `data-accent` | gold, teal, navy, plum | Accent, tint, hairline, on-accent text |
| `data-density` | compact, comfortable, spacious | Card padding 16 / 24 / 36px, and all raw Tailwind spacing with it |
| `data-scale` | sm, md, lg | Whole type ramp, e.g. 37 / 40 / 45px at `--u-text-3xl` |
| `data-mode` | dark, light | Flips the entire surface system |

`ThemeScope` sets the first three from `screen.theme`. `data-mode`
defaults to dark; pass `mode="light"` if an audience expects it.

## Four things found while doing this

**1. `--u-scale` alone could never rescale the type ramp.**
`REMAINING-WORK.md` assumes it can. A custom property resolves its
`var()` references where it is *declared*, so `--u-text-base` declared on
`:root` permanently bakes in `:root`'s `--u-scale` of 1. Overriding
`--u-scale` further down the tree never reaches it and the type silently
stays put. The `[data-scale]` block redeclares the ramp on the same
element that carries the new scale so the `calc()` re-resolves there.

**2. The ~66 raw Tailwind spacing utilities now respond to density.**
Each density block also sets `--spacing`, Tailwind 4's base unit, which
every `p-*`, `gap-*`, `space-y-*` and `m-*` utility compiles against.
That is what makes the density change visible rather than subtle.
Sizing utilities such as `size-4` read `--spacing` too, so icons scale
with density; drop the `--spacing` line from each block if you would
rather they did not.

**3. Three hardcoded colours survived the "no hardcoded colours" audit**
by being `rgba()` rather than hex, so a hex grep missed them:

- `ui/Card.tsx` hero shadow: `rgba(15,95,107,0.35)` — the old teal
- `ui/Card.tsx` standard shadow: `rgba(20,22,26,0.04)`
- `NextActionCard.tsx` takeover shadow: `rgba(15,95,107,0.55)`

Left alone these paint a **teal** glow around a navy or plum hero once
accent switching lands, which is a bug independent of Aurora. The
stylesheet overrides them from unlayered CSS so nothing needs editing,
but the honest fix is one line each, e.g.
`shadow-[0_2px_24px_-8px_rgba(15,95,107,0.35)]` →
`shadow-[var(--u-shadow-glow)]`.

**4. Nine places pair a literal `text-white` or `bg-white` with a token
background.** Correct while `--u-ink` and `--u-positive` are dark
colours; broken the moment they invert. The level switcher in `DemoBar`
rendered white text on a near-white pill and was unreadable. Repaired by
targeting the exact class pairing rather than editing nine components.
`var(--u-page)` is always the inverse of `var(--u-ink)` in both modes, so
that repair needs no light-mode counterpart.

## Contrast

Audited against the running app, walking every text node and compositing
its true effective background through the translucent surfaces and the
blur. Not a spot check.

| Screen | Failures |
|---|---|
| Maya, bronze | 0 |
| Daniel, gold, signal fired | 0 |
| Priya, silver | 0 |
| `/gallery` | 0 |

Two token adjustments were needed to get there:

- `--u-ink-faint` was landing at 4.14 against a 4.5 requirement. Worth
  knowing: **it failed in the original light theme too, at 3.76**, so
  this is a pre-existing issue the dark flip surfaced rather than caused.
  Now passes in both modes.
- `--u-positive` was 4.38 as pill text on its own tint. Lifted slightly,
  which also improves the solid check ticks.

Excluded as deliberate: `aria-hidden` spans with `text-transparent`, the
empty checkbox glyphs.

## One decision left for you

The three persona configs already specify distinct themes that nothing
was consuming:

| Persona | accent | density |
|---|---|---|
| Maya | teal | spacious |
| Daniel | navy | compact |
| Priya | plum | comfortable |

Wiring `ThemeScope` makes all three visibly different immediately, which
is a strong chunk 9 demo. But it also means **gold never appears**, since
no config asks for it and it is not in `ThemeSchema`'s enum.

If you want Aurora's signature gold on screen, add `"gold"` to
`ThemeSchema` and set it on whichever persona should carry it. Nothing
else changes; the gold values are already in the stylesheet and are what
`:root` falls back to.

## Left alone deliberately

- **The type ramp rem values.** Changing them would reflow every layout
  for no gain in look. Only the scaling mechanism was fixed.
- **`--font-sans`.** Wired to `next/font` Geist in `app/layout.tsx`.
- **Studio's JSON editor palette.** Its hardcoded syntax colours sit on
  their own dark ground and still read correctly.
- **The ten components.** Untouched, which was the point.

## Verified

`tsc --noEmit` clean, `eslint` clean, `next build` succeeds, no console
errors on any persona screen.
