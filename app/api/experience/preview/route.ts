// app/api/experience/preview/route.ts
// The studio's right-hand pane. Same pipeline as the live endpoint, run over a
// config that is being typed rather than one on disk. Nothing is written here.

import { LevelSchema } from "@/lib/contract";
import { ConfigNotFoundError } from "@/lib/config";
import { previewScreen, ScreenValidationError } from "@/lib/resolver";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { personaId?: string; level?: string; config?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Bad request", message: "Body must be JSON." },
      { status: 400 }
    );
  }

  const level = LevelSchema.safeParse(body.level ?? "bronze");
  if (!level.success) {
    return Response.json(
      { error: "Unknown level", message: `Received "${body.level}".` },
      { status: 400 }
    );
  }

  try {
    const screen = await previewScreen(
      body.config,
      body.personaId ?? "daniel",
      level.data
    );
    return Response.json(screen, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      return Response.json(
        { error: "Config not found", message: error.message },
        { status: 404 }
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
