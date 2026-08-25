// app/api/experience/home/route.ts
// GET /api/experience/home?personaId=daniel&level=bronze&customerId=cust-8842
//
// The whole SDUI story is visible here: the client asks for a screen and the
// server sends back a layout tree. Nothing about what renders lives on the client.

import { LevelSchema } from "@/lib/contract";
import { ConfigNotFoundError, ConfigParseError } from "@/lib/config";
import { resolveScreen, ScreenValidationError } from "@/lib/resolver";
import type { Facts } from "@/lib/rules";

/**
 * Signals fired from the demo toolbar arrive as `?signal=key:value`, applied
 * over whatever the data file says at rest. Nothing is written to disk — the
 * URL is the whole state, so a fired screen is a link you can share or go back
 * from mid-demo.
 */
function readSignalOverrides(params: URLSearchParams): Facts {
  const overrides: Facts = {};

  for (const raw of params.getAll("signal")) {
    const separator = raw.indexOf(":");
    if (separator === -1) continue;

    const key = raw.slice(0, separator);
    const value = raw.slice(separator + 1);
    if (!key) continue;

    if (value === "true") overrides[key] = true;
    else if (value === "false") overrides[key] = false;
    else if (value.trim() !== "" && Number.isFinite(Number(value))) {
      overrides[key] = Number(value);
    } else overrides[key] = value;
  }

  return overrides;
}

/** Config is read from disk per request. Never cache this route. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const personaId = params.get("personaId") ?? "daniel";
  const customerId = params.get("customerId") ?? undefined;

  const level = LevelSchema.safeParse(params.get("level") ?? "bronze");
  if (!level.success) {
    return Response.json(
      {
        error: "Unknown level",
        message: `level must be one of bronze, silver or gold — received "${params.get("level")}".`,
      },
      { status: 400 }
    );
  }

  try {
    const screen = await resolveScreen({
      personaId,
      level: level.data,
      customerId,
      signalOverrides: readSignalOverrides(params),
    });
    return Response.json(screen, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      return Response.json(
        { error: "Config not found", message: error.message },
        { status: 404 }
      );
    }

    // A malformed config file is a configuration problem, not a server fault.
    if (error instanceof ConfigParseError) {
      return Response.json(
        { error: "Invalid config JSON", message: error.message },
        { status: 422 }
      );
    }

    if (error instanceof ScreenValidationError) {
      return Response.json(
        {
          error: "Screen failed validation",
          message: error.message,
          issues: error.issues,
        },
        { status: 422 }
      );
    }

    throw error;
  }
}
