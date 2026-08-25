// app/api/experience/home/route.ts
// GET /api/experience/home?personaId=daniel&level=bronze&customerId=cust-8842
//
// The whole SDUI story is visible here: the client asks for a screen and the
// server sends back a layout tree. Nothing about what renders lives on the client.

import { LevelSchema } from "@/lib/contract";
import { ConfigNotFoundError, ConfigParseError } from "@/lib/config";
import { resolveScreen, ScreenValidationError } from "@/lib/resolver";

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
