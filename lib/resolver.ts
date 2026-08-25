// lib/resolver.ts
// The resolver pipeline. One code path; `level` decides where it stops.
//
//   1. BASE      /config/personas/{persona}.json      → BRONZE stops here
//   2. CONTEXT   /config/rules/context.json           → SILVER stops here
//   3. SIGNAL    /config/rules/signals.json           → GOLD                (chunk 8)
//   4. OVERRIDE  /config/overrides/{customerId}.json                        (chunk 10)
//   5. VALIDATE  ScreenSchema.parse()
//   6. HYDRATE   /config/data/{persona}.json into slot props
//
// Stages 2-4 are the same function called with different rule files and
// different facts. There is no branch per persona anywhere below, and no
// branch per level beyond the two comparisons that decide where to stop.

import { z } from "zod";
import {
  RuleSetSchema,
  ScreenSchema,
  type Level,
  type RuleSet,
  type Screen,
  type Slot,
  type TraceEntry,
} from "./contract";
import { assertSafeId, readConfigJson, readOptionalConfigJson } from "./config";
import { applyRules, type Facts } from "./rules";

/** The resolved tree does not satisfy ScreenSchema. Surfaced as a 422. */
export class ScreenValidationError extends Error {
  readonly issues: { path: string; message: string }[];

  constructor(message: string, issues: { path: string; message: string }[]) {
    super(message);
    this.issues = issues;
  }
}

/**
 * A persona's customer data. Layout lives in /config/personas; the numbers,
 * the durable facts and the behavioural signals live here.
 */
export const DataFileSchema = z.object({
  personaId: z.string(),
  /** Where this persona sits in the playback. Journey order, not alphabetical. */
  order: z.number().default(99),
  customer: z
    .object({
      firstName: z.string(),
      lastName: z.string().optional(),
      /** One line for the room, so everyone knows who they are looking at. */
      summary: z.string().optional(),
    })
    .optional(),
  /** Durable facts about the relationship. Silver reads these. */
  attributes: z.record(z.unknown()).default({}),
  /** Recent behaviour. Gold reads these. */
  signals: z.record(z.unknown()).default({}),
  /**
   * Signals the demo toolbar can flip on stage. Scripted and illustrative —
   * the spec is explicit that this is a toggle, not behavioural tracking.
   */
  demoSignals: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()]),
        note: z.string().optional(),
      })
    )
    .default([]),
  /** slot id → props to merge over that slot's layout props. */
  slots: z.record(z.record(z.unknown())).default({}),
});
export type DataFile = z.infer<typeof DataFileSchema>;

export type ResolveRequest = {
  personaId: string;
  level: Level;
  customerId?: string;
  /** Signal overrides from the demo toolbar, applied over the data file. */
  signalOverrides?: Facts;
};

/** Which stages run at which level. One pipeline, three stopping points. */
const RUNS_CONTEXT: Record<Level, boolean> = {
  bronze: false,
  silver: true,
  gold: true,
};
const RUNS_SIGNALS: Record<Level, boolean> = {
  bronze: false,
  silver: false,
  gold: true,
};

export async function resolveScreen({
  personaId,
  level,
  signalOverrides,
}: ResolveRequest): Promise<Screen> {
  const persona = assertSafeId("personaId", personaId);
  const data = await loadData(persona);
  const raw = await readConfigJson("personas", `${persona}.json`);
  const base = parseBase(raw, `config/personas/${persona}.json`, level);

  return assemble({ base, persona, level, data, signalOverrides });
}

/**
 * The same pipeline, run over a config that is being typed rather than one on
 * disk. The studio needs this: a right-hand pane that skipped hydration would
 * be a screen full of fallback cards, and one that skipped the rules would not
 * show what Silver or Gold does to an edit.
 */
export async function previewScreen(
  config: unknown,
  personaId: string,
  level: Level,
  signalOverrides?: Facts
): Promise<Screen> {
  const persona = assertSafeId("personaId", personaId);
  const data = await loadData(persona);
  const base = parseBase(config, "the config in the editor", level);

  return assemble({ base, persona, level, data, signalOverrides });
}

/* --- the pipeline ------------------------------------------------------- */

async function assemble({
  base,
  persona,
  level,
  data,
  signalOverrides,
}: {
  base: Screen;
  persona: string;
  level: Level;
  data: DataFile | null;
  signalOverrides?: Facts;
}): Promise<Screen> {
  const trace: TraceEntry[] = [];

  // --- 1. BASE ---------------------------------------------------------
  let slots: Slot[] = base.slots;
  trace.push(...baseTrace(slots));

  // --- 2. CONTEXT ------------------------------------------------------
  if (RUNS_CONTEXT[level]) {
    const rules = await loadRules("context.json");
    const result = applyRules(slots, rules, data?.attributes ?? {}, "context");
    slots = result.slots;
    trace.push(...result.trace);
  }

  // --- 3. SIGNAL -------------------------------------------------------
  // The same applyRules call as stage 2, with a different rule file and a
  // different bag of facts. That is the whole difference between Silver and
  // Gold; there is no second evaluator.
  if (RUNS_SIGNALS[level]) {
    const rules = await loadRules("signals.json");
    const facts = { ...(data?.signals ?? {}), ...(signalOverrides ?? {}) };
    const result = applyRules(slots, rules, facts, "signal");
    slots = result.slots;
    trace.push(...result.trace);
  }

  // --- 4. OVERRIDE -----------------------------------------------------
  // Chunk 10.

  // --- 5. VALIDATE -----------------------------------------------------
  // Re-validated after the rules have had their way, so a rule that inserts a
  // malformed slot is a 422 rather than a broken card.
  const result = ScreenSchema.safeParse({ ...base, slots, trace });
  if (!result.success) {
    throw new ScreenValidationError(
      `The resolved screen for ${persona} does not match the contract.`,
      issuesOf(result.error)
    );
  }

  const screen = result.data;

  // --- 6. HYDRATE ------------------------------------------------------
  if (data) {
    screen.slots = screen.slots.map((slot) => {
      const values = data.slots[slot.id];
      if (!values) return slot;
      // Customer data wins over layout copy. A slot the data file says nothing
      // about keeps exactly what the layout gave it.
      return { ...slot, props: { ...slot.props, ...values } };
    });
  }

  return screen;
}

/* --- loading ------------------------------------------------------------ */

/**
 * Turn a config into typed slots. This is not the VALIDATE stage — it is how
 * JSON becomes something the evaluator can work with. Stage 5 validates again
 * once the rules have finished.
 */
function parseBase(raw: unknown, source: string, level: Level): Screen {
  const parsed = ScreenSchema.safeParse({
    ...(raw as Record<string, unknown>),
    level,
  });
  if (!parsed.success) {
    throw new ScreenValidationError(
      `${source} does not match the screen contract.`,
      issuesOf(parsed.error)
    );
  }
  return parsed.data;
}

/** Every slot that came with a reason explains itself at stage 1. */
function baseTrace(slots: Slot[]): TraceEntry[] {
  return slots
    .filter((slot) => slot.reason)
    .map((slot) => ({
      stage: "base" as const,
      slotId: slot.id,
      action: "added" as const,
      reason: slot.reason as string,
    }));
}

async function loadRules(file: string): Promise<RuleSet> {
  const raw = await readOptionalConfigJson("rules", file);
  if (raw === null) return [];

  const parsed = RuleSetSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ScreenValidationError(
      `config/rules/${file} is not a valid rule set.`,
      issuesOf(parsed.error)
    );
  }
  return parsed.data;
}

export async function loadData(persona: string): Promise<DataFile | null> {
  const raw = await readOptionalConfigJson("data", `${persona}.json`);
  if (raw === null) return null;

  const parsed = DataFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ScreenValidationError(
      `config/data/${persona}.json is not a valid data file.`,
      issuesOf(parsed.error)
    );
  }
  return parsed.data;
}

function issuesOf(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}
