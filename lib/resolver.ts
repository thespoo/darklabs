// lib/resolver.ts
// The resolver pipeline. One code path; `level` decides where it stops.
//
//   1. BASE      /config/personas/{persona}.json      → BRONZE stops here
//   2. CONTEXT   /config/rules/context.json           → SILVER stops here   (chunk 6)
//   3. SIGNAL    /config/rules/signals.json           → GOLD                (chunk 8)
//   4. OVERRIDE  /config/overrides/{customerId}.json                        (chunk 10)
//   5. VALIDATE  ScreenSchema.parse()
//   6. HYDRATE   /config/data/{persona}.json into slot props
//
// Stages 1-4 append to `trace`. Hydration does not — it changes what the
// numbers say, not what the screen decided, and TraceEntry has no stage for it.

import { z } from "zod";
import { ScreenSchema, type Level, type Screen, type TraceEntry } from "./contract";
import { assertSafeId, readConfigJson, readOptionalConfigJson } from "./config";

/** The resolved tree does not satisfy ScreenSchema. Surfaced as a 422. */
export class ScreenValidationError extends Error {
  readonly issues: { path: string; message: string }[];

  constructor(message: string, issues: { path: string; message: string }[]) {
    super(message);
    this.issues = issues;
  }
}

/**
 * A persona's customer data. Layout lives in /config/personas; the numbers live
 * here, keyed by the slot they belong to.
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
  /** slot id → props to merge over that slot's layout props. */
  slots: z.record(z.record(z.unknown())).default({}),
});
export type DataFile = z.infer<typeof DataFileSchema>;

export type ResolveRequest = {
  personaId: string;
  level: Level;
  customerId?: string;
};

export async function resolveScreen({
  personaId,
  level,
}: ResolveRequest): Promise<Screen> {
  const persona = assertSafeId("personaId", personaId);
  const trace: TraceEntry[] = [];

  // --- 1. BASE ---------------------------------------------------------
  const base = (await readConfigJson(
    "personas",
    `${persona}.json`
  )) as Record<string, unknown>;

  const draft: Record<string, unknown> = { ...base, level };

  // Read loosely: this runs before validation, so nothing here may assume the
  // file is well formed.
  for (const slot of Array.isArray(draft.slots) ? draft.slots : []) {
    const reason = (slot as Record<string, unknown>)?.reason;
    if (typeof reason === "string" && reason.length > 0) {
      trace.push({
        stage: "base",
        slotId: String((slot as Record<string, unknown>).id ?? "unknown"),
        action: "added",
        reason,
      });
    }
  }

  // --- 2. CONTEXT / 3. SIGNAL / 4. OVERRIDE ----------------------------
  // Added in chunks 6, 8 and 10. They mutate `draft.slots` and push to `trace`.

  // --- 5. VALIDATE -----------------------------------------------------
  const result = ScreenSchema.safeParse({ ...draft, trace });
  if (!result.success) {
    throw new ScreenValidationError(
      `config/personas/${persona}.json does not match the screen contract.`,
      result.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(root)",
        message: issue.message,
      }))
    );
  }

  const screen = result.data;

  // --- 6. HYDRATE ------------------------------------------------------
  const data = await loadData(persona);
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

export async function loadData(persona: string): Promise<DataFile | null> {
  const raw = await readOptionalConfigJson("data", `${persona}.json`);
  if (raw === null) return null;

  const parsed = DataFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ScreenValidationError(
      `config/data/${persona}.json is not a valid data file.`,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(root)",
        message: issue.message,
      }))
    );
  }
  return parsed.data;
}
