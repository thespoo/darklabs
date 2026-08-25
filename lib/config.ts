// lib/config.ts
// Filesystem access for the /config tree.
// Read fresh on every request, no caching — that is what makes live editing work.

import { promises as fs } from "fs";
import path from "path";

export const CONFIG_ROOT = path.join(process.cwd(), "config");

/** The config file for this id does not exist. */
export class ConfigNotFoundError extends Error {}

/** The config file exists but is not parseable JSON. */
export class ConfigParseError extends Error {}

/**
 * Ids arrive from query params and are used to build file paths.
 * Anything that isn't a plain slug is rejected before it touches the disk.
 */
export function assertSafeId(kind: string, id: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
    throw new ConfigNotFoundError(`"${id}" is not a valid ${kind}.`);
  }
  return id;
}

export function configPath(...segments: string[]): string {
  return path.join(CONFIG_ROOT, ...segments);
}

/** Read and parse a config file. Throws ConfigNotFoundError / ConfigParseError. */
export async function readConfigJson(...segments: string[]): Promise<unknown> {
  const relative = `config/${segments.join("/")}`;
  let raw: string;

  try {
    raw = await fs.readFile(configPath(...segments), "utf8");
  } catch {
    throw new ConfigNotFoundError(`No config file at ${relative}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new ConfigParseError(
      `${relative} is not valid JSON — ${(error as Error).message}`
    );
  }
}

/** Read a config file, returning null when it simply isn't there. Parse errors still throw. */
export async function readOptionalConfigJson(
  ...segments: string[]
): Promise<unknown | null> {
  try {
    return await readConfigJson(...segments);
  } catch (error) {
    if (error instanceof ConfigNotFoundError) return null;
    throw error;
  }
}
