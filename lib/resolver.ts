// lib/resolver.ts
// The resolver pipeline. One code path; `level` decides where it stops.
//
//   1. BASE      /config/personas/{persona}.json      → BRONZE stops here
//   2. CONTEXT   /config/rules/context.json           → SILVER stops here   (chunk 6)
//   3. SIGNAL    /config/rules/signals.json           → GOLD                (chunk 8)
//   4. OVERRIDE  /config/overrides/{customerId}.json                        (chunk 10)
//   5. VALIDATE  ScreenSchema.parse()
//   6. HYDRATE   /config/data/{persona}.json into slot props                (chunk 4)

import { ScreenSchema, type Level, type Screen } from "./contract";
import { assertSafeId, readConfigJson } from "./config";

/** The resolved tree does not satisfy ScreenSchema. Surfaced as a 422. */
export class ScreenValidationError extends Error {
  readonly issues: { path: string; message: string }[];

  constructor(message: string, issues: { path: string; message: string }[]) {
    super(message);
    this.issues = issues;
  }
}

export type ResolveRequest = {
  personaId: string;
  level: Level;
  customerId?: string;
};

export async function resolveScreen({
  personaId,
  level,
}: ResolveRequest): Promise<Screen> {
  // 1. BASE — the persona's layout tree, exactly as it sits on disk.
  const base = await readConfigJson(
    "personas",
    `${assertSafeId("personaId", personaId)}.json`
  );

  // Stages 2–4 are added in later chunks. They operate on this same draft.
  const draft = { ...(base as Record<string, unknown>), level };

  // 5. VALIDATE
  const result = ScreenSchema.safeParse(draft);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
    }));
    throw new ScreenValidationError(
      `config/personas/${personaId}.json does not match the screen contract.`,
      issues
    );
  }

  return result.data;
}
