// components/registry.ts
// The single map from a name in the schema to the thing that draws it.
//
// `Record<ComponentName, RegistryEntry>` is doing real work: TypeScript will
// not compile this file if a component from ComponentNameSchema is missing, or
// if a name appears here that is not in the enum. The ten names in the contract
// and the ten keys below cannot drift apart.

import type { ComponentType } from "react";
import { z } from "zod";
import type { ComponentName, Prominence } from "@/lib/contract";

import {
  AffordabilityCalculator,
  AffordabilityCalculatorProps,
} from "./AffordabilityCalculator";
import { MortgageSummary, MortgageSummaryProps } from "./MortgageSummary";
import { EquityCard, EquityCardProps } from "./EquityCard";
import {
  SavingsProgressCard,
  SavingsProgressCardProps,
} from "./SavingsProgressCard";
import { StatusCard, StatusCardProps } from "./StatusCard";
import { Checklist, ChecklistProps } from "./Checklist";
import { LifeStageIntro, LifeStageIntroProps } from "./LifeStageIntro";
import { ContentCard, ContentCardProps } from "./ContentCard";
import { NextActionCard, NextActionCardProps } from "./NextActionCard";
import { AdviserCard, AdviserCardProps } from "./AdviserCard";

/** What the renderer gets back for a name it looks up. */
export type RegistryEntry = {
  schema: z.ZodTypeAny;
  // Props are checked against `schema` at render time, which is the only
  // guarantee available for a tree that arrived over HTTP. This is the one
  // place the build gives up static typing, deliberately and visibly.
  component: ComponentType<Record<string, unknown> & { prominence?: Prominence }>;
};

/**
 * Pairs a component with its own props schema, and checks at compile time that
 * the component really does accept what the schema describes.
 */
function entry<S extends z.ZodTypeAny>(
  schema: S,
  component: ComponentType<z.input<S> & { prominence?: Prominence }>
): RegistryEntry {
  return { schema, component: component as RegistryEntry["component"] };
}

export const ComponentRegistry: Record<ComponentName, RegistryEntry> = {
  // Substantive
  AffordabilityCalculator: entry(
    AffordabilityCalculatorProps,
    AffordabilityCalculator
  ),
  MortgageSummary: entry(MortgageSummaryProps, MortgageSummary),
  EquityCard: entry(EquityCardProps, EquityCard),
  SavingsProgressCard: entry(SavingsProgressCardProps, SavingsProgressCard),
  StatusCard: entry(StatusCardProps, StatusCard),
  Checklist: entry(ChecklistProps, Checklist),

  // Simple cards
  LifeStageIntro: entry(LifeStageIntroProps, LifeStageIntro),
  ContentCard: entry(ContentCardProps, ContentCard),
  NextActionCard: entry(NextActionCardProps, NextActionCard),
  AdviserCard: entry(AdviserCardProps, AdviserCard),
};

export function lookup(name: string): RegistryEntry | undefined {
  return ComponentRegistry[name as ComponentName];
}
