// lib/contract.ts
// The interface between the backend and the component library.
// Everything in this build hangs off these types. Change with care.

import { z } from "zod";

/** Maturity level. Decides where the resolver pipeline stops. */
export const LevelSchema = z.enum(["bronze", "silver", "gold"]);
export type Level = z.infer<typeof LevelSchema>;

/** Theme tokens. Components read these as CSS custom properties, never hardcoded values. */
export const ThemeSchema = z.object({
  accent: z.enum(["teal", "navy", "plum"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
  scale: z.enum(["sm", "md", "lg"]),
});
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * The ten shared components. This enum is the single source of truth —
 * the renderer registry must have exactly these keys, no more, no fewer.
 */
export const ComponentNameSchema = z.enum([
  // Substantive
  "AffordabilityCalculator",
  "MortgageSummary",
  "EquityCard",
  "SavingsProgressCard",
  "StatusCard",
  "Checklist",
  // Simple cards
  "LifeStageIntro",
  "ContentCard",
  "NextActionCard",
  "AdviserCard",
]);
export type ComponentName = z.infer<typeof ComponentNameSchema>;

/** How loudly a slot is rendered. Gold-level signals mostly change this, rather than adding components. */
export const ProminenceSchema = z.enum(["hero", "standard", "muted"]);
export type Prominence = z.infer<typeof ProminenceSchema>;

export const SlotSchema = z.object({
  /** Stable identifier, e.g. "aip-status". Rules and overrides target slots by this. */
  id: z.string(),
  component: ComponentNameSchema,
  prominence: ProminenceSchema.default("standard"),
  span: z.enum(["full", "half"]).default("full"),
  /** Validated per-component at render time against that component's own props schema. */
  props: z.record(z.unknown()),
  /**
   * Why this slot is in the base layout, in plain English. Copied into the
   * trace at stage 1 so a Bronze screen can explain itself too, rather than
   * the trace only filling up once rules start firing.
   */
  reason: z.string().optional(),
});
export type Slot = z.infer<typeof SlotSchema>;

/**
 * Why the screen looks the way it does.
 * Rendered in the debug panel in plain English during the playback.
 */
export const TraceEntrySchema = z.object({
  stage: z.enum(["base", "context", "signal", "override"]),
  slotId: z.string(),
  action: z.enum([
    "added",
    "removed",
    "moved",
    "promoted",
    "demoted",
    "rewritten",
  ]),
  /** Written for a stakeholder audience. About the customer, never about the code. */
  reason: z.string(),
});
export type TraceEntry = z.infer<typeof TraceEntrySchema>;

export const ScreenSchema = z.object({
  screen: z.literal("home"),
  personaId: z.string(),
  level: LevelSchema,
  version: z.string(),
  theme: ThemeSchema,
  /** ORDER IS THE PRIORITY. Never sorted on the client. */
  slots: z.array(SlotSchema),
  trace: z.array(TraceEntrySchema),
});
export type Screen = z.infer<typeof ScreenSchema>;

// ---------------------------------------------------------------------------
// Rules. Used by both the context (Silver) and signal (Gold) stages.
// One evaluator, two inputs. Do not write this twice.
// ---------------------------------------------------------------------------

export const ConditionSchema = z.object({
  /** Key looked up in the customer's attributes (Silver) or signals (Gold) object. */
  attribute: z.string(),
  equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
  greaterThan: z.number().optional(),
  lessThan: z.number().optional(),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const RuleActionSchema = z.object({
  action: z.enum(["promote", "demote", "remove", "add", "move", "rewrite"]),
  slotId: z.string(),
  /** For promote/demote. */
  to: ProminenceSchema.optional(),
  /** For move: target index in the slots array. */
  toIndex: z.number().optional(),
  /** For add: the whole slot to insert. For rewrite: a partial props patch. */
  slot: SlotSchema.optional(),
  props: z.record(z.unknown()).optional(),
});
export type RuleAction = z.infer<typeof RuleActionSchema>;

export const RuleSchema = z.object({
  id: z.string(),
  when: ConditionSchema,
  then: z.array(RuleActionSchema),
  /** Copied into the trace when the rule fires. Plain English. */
  reason: z.string(),
});
export type Rule = z.infer<typeof RuleSchema>;

export const RuleSetSchema = z.array(RuleSchema);
export type RuleSet = z.infer<typeof RuleSetSchema>;
