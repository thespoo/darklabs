// lib/rules.ts
// One evaluator. Silver feeds it the customer's attributes, Gold feeds it their
// signals, and nothing in here knows which is which — it takes a bag of facts
// and a list of rules and returns new slots plus the trace entries explaining
// what it did. Writing this twice was the explicit thing not to do.
//
// There is no persona logic here and there must never be any. If this file ever
// needs an `if` per customer, the central claim of the demo has broken.

import type {
  Condition,
  Rule,
  RuleAction,
  RuleSet,
  Slot,
  TraceEntry,
} from "./contract";

/** The stages that run rules. Hydration doesn't, and base has no rules. */
export type RuleStage = Extract<
  TraceEntry["stage"],
  "context" | "signal" | "override"
>;

export type Facts = Record<string, unknown>;

/**
 * All comparators present must hold. A condition naming an attribute the
 * customer doesn't have never fires — which is what lets one shared rule file
 * cover three customers without any of them needing to know about the others.
 */
export function matches(condition: Condition, facts: Facts): boolean {
  const value = facts[condition.attribute];
  if (value === undefined || value === null) return false;

  if (condition.equals !== undefined && value !== condition.equals) {
    return false;
  }

  if (condition.greaterThan !== undefined) {
    if (typeof value !== "number" || !(value > condition.greaterThan)) {
      return false;
    }
  }

  if (condition.lessThan !== undefined) {
    if (typeof value !== "number" || !(value < condition.lessThan)) {
      return false;
    }
  }

  // No comparator at all is a presence check: "this customer has one of these".
  return true;
}

export type ApplyResult = {
  slots: Slot[];
  trace: TraceEntry[];
};

export function applyRules(
  slots: Slot[],
  rules: RuleSet,
  facts: Facts,
  stage: RuleStage
): ApplyResult {
  let current = [...slots];
  const trace: TraceEntry[] = [];

  for (const rule of rules) {
    if (!matches(rule.when, facts)) continue;

    for (const action of rule.then) {
      const outcome = applyAction(current, action, rule, stage);
      if (outcome) {
        current = outcome.slots;
        trace.push(outcome.entry);
      }
      // An action that changed nothing — usually because this customer's screen
      // has no such slot — is silent. One shared rule file, three customers.
    }
  }

  return { slots: current, trace };
}

type ActionOutcome = { slots: Slot[]; entry: TraceEntry } | null;

function applyAction(
  slots: Slot[],
  action: RuleAction,
  rule: Rule,
  stage: RuleStage
): ActionOutcome {
  const index = slots.findIndex((slot) => slot.id === action.slotId);

  const entry = (traceAction: TraceEntry["action"]): TraceEntry => ({
    stage,
    slotId: action.slotId,
    action: traceAction,
    reason: rule.reason,
  });

  switch (action.action) {
    case "add": {
      // Adding something already on the screen would duplicate it.
      if (index !== -1 || !action.slot) return null;
      const next = [...slots];
      const at =
        action.toIndex === undefined
          ? next.length
          : clamp(action.toIndex, 0, next.length);
      next.splice(at, 0, action.slot);
      return { slots: next, entry: entry("added") };
    }

    case "remove": {
      if (index === -1) return null;
      return {
        slots: slots.filter((_, i) => i !== index),
        entry: entry("removed"),
      };
    }

    case "promote":
    case "demote": {
      if (index === -1) return null;
      const to = action.to ?? (action.action === "promote" ? "hero" : "muted");
      // Already at that weight — say nothing rather than narrate a non-event.
      if (slots[index].prominence === to) return null;
      const next = [...slots];
      next[index] = { ...next[index], prominence: to };
      return {
        slots: next,
        entry: entry(action.action === "promote" ? "promoted" : "demoted"),
      };
    }

    case "move": {
      if (index === -1 || action.toIndex === undefined) return null;
      const to = clamp(action.toIndex, 0, slots.length - 1);
      if (to === index) return null;
      const next = [...slots];
      const [moved] = next.splice(index, 1);
      next.splice(to, 0, moved);
      return { slots: next, entry: entry("moved") };
    }

    case "rewrite": {
      if (index === -1 || !action.props) return null;
      const next = [...slots];
      next[index] = {
        ...next[index],
        props: { ...next[index].props, ...action.props },
      };
      return { slots: next, entry: entry("rewritten") };
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
