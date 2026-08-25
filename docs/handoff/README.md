# Unicorn SDUI Mortgage POC — handoff

Context pack for an agent picking up this build. Everything here describes the
repository at **https://github.com/thespoo/darklabs**, branch `main`.

Chunks 1–8 are complete, committed and pushed. **Chunks 9 and 10 remain.**

---

## What this is

A server-driven UI proof of concept for a mortgage journey. The **server**
decides which components render, in what order, with what props. The client is a
dumb renderer. Three customers see visibly different screens assembled from one
shared library of ten components, and a configuration change flows through to
the interface without a rebuild.

It exists to be presented. There is a seven-beat playback script (§ below) and
almost every design decision in the codebase serves it. When a trade-off comes
up between engineering elegance and the demo not falling over on stage, the demo
wins.

---

## Read these in order

| # | File | Why |
|---|---|---|
| 1 | This file | Orientation, status, how to run |
| 2 | `ARCHITECTURE.md` | The contract, the pipeline, the file map, the invariants |
| 3 | `REMAINING-WORK.md` | Chunks 9 and 10, specified to acceptance-criterion level |
| 4 | `GOTCHAS.md` | Traps already hit, and decisions that must not be relitigated |

Then, **in the repo itself**:

- `CLAUDE.md` — the project rules. Nine hard rules, all still in force.
- `sdui-mortgage-poc-spec.md` — the original build spec, including the persona
  briefs and the proof points.
- `claude-code-prompts.md` — the chunk-by-chunk plan these commits follow.

`CLAUDE.md` is the authority. This handoff pack describes what was built and
what is left; it does not override the rules.

---

## Running it

```bash
git clone https://github.com/thespoo/darklabs.git
cd darklabs
npm install
npm run dev
```

Then <http://localhost:3000>.

Config is read from disk fresh on every request with no caching, so editing
anything under `/config` changes the app on the next refresh — no restart, no
rebuild. That is load-bearing for the demo, not an optimisation.

### Routes

| Route | What it is |
|---|---|
| `/` | The demo. Persona + level switcher, trace panel underneath |
| `/studio` | Split-screen config editor, live render on the right |
| `/gallery` | All ten components, every variant, all three prominence levels |
| `/dev/renderer` | Renderer test — eight hand-written slots, two broken on purpose |
| `/api/experience/home?personaId=&level=&signal=` | The layout tree |
| `/api/personas` | The switcher's contents |
| `/api/config` | GET/POST a persona layout file |
| `/api/experience/preview` | POST a config, get the resolved screen back |

### Checks

```bash
npx tsc --noEmit && npx eslint .
```

Both pass on `main`. Keep it that way — run them before declaring a chunk done.

---

## Status

| Chunk | State | Proof point |
|---|---|---|
| 1 — Scaffold and contract | **done** | — |
| 2 — Component library | **done** | P1 |
| 3 — The renderer | **done** | — |
| 4 — Bronze, end to end | **done** | P2 |
| 5 — Switcher and trace panel | **done** | P6 |
| 6 — Silver: context rules | **done** | P4 |
| 7 — Config studio | **done** | P3 |
| 8 — Gold: signals | **done** | P5 |
| 9 — Theme tokens | **not started** | — |
| 10 — Individual override | **not started** (stretch) | — |

All six proof points from the spec already pass. Chunks 9 and 10 add polish and
a stretch feature; neither is required for the playback to work.

### What "done" means here

Each completed chunk was verified against its own acceptance criterion in a real
browser, not just typechecked. `REMAINING-WORK.md` and `GOTCHAS.md` record what
was actually observed. Notable verifications:

- Corrupting a config returns 422 naming the exact slot path, never a 500.
- Registry drift is a compile error — proven three ways (missing key, extra key,
  mismatched component/schema pair).
- A slot with bad props degrades to a card naming the failure; the rest of the
  page renders.
- Switching persona is a client navigation, verified by stamping the document
  and finding the stamp intact afterwards.
- Breaking a config mid-session leaves the last good screen on display with the
  error above it. The stage never goes blank.
- Saving an invalid config through the studio returns 422 and leaves the file on
  disk byte-identical.
- Firing Daniel's signal moves his AIP standard → hero and his education
  standard → muted, with a readable reason in the trace.

---

## The playback script

Seven beats, roughly six minutes. This is what the build is for.

1. **Maya, Bronze** — education and deposit progress lead, no application
   pressure. "This is configuration, not code."
2. **Daniel, Bronze** — the same components, reassembled. AIP and borrowing
   lead, education recedes.
3. **Priya, Bronze** — components the other two structurally cannot have,
   because she holds a mortgage with us.
4. **Network tab** — "None of this is in the client. The server sent this tree."
5. **Priya, Bronze → Silver** — her existing position moves to the top. Read the
   reason off the trace panel.
6. **Daniel, Silver → Gold**, then click *Fire a signal* — AIP jumps to hero,
   seen-before content fades. "Adaptation is about timing, not about using
   someone's first name."
7. **`/studio`** — reorder a slot live. "No deploy, no release, no app store."

As URLs:

```
/?personaId=maya&level=bronze
/?personaId=daniel&level=bronze
/?personaId=priya&level=bronze
/api/experience/home?personaId=priya&level=silver     ← beat 4, open in its own tab
/?personaId=priya&level=silver
/?personaId=daniel&level=gold                         ← then click Fire a signal
/studio
```

---

## If you are Codex reading this from inside the repo

`darklabs/AGENTS.md` already exists and is **written and rewritten by
`next dev`** — it carries Next.js 16's own agent guidance. Do not replace it.
Append to it, or leave it alone and read this pack instead.

`darklabs/CLAUDE.md` ends with an `@AGENTS.md` import line so both are picked up.
