// app/api/config/route.ts
// Read and write a persona's layout file.
//
// GET returns the file as text, because the studio edits text — reformatting a
// config through JSON.parse would move the author's line breaks around under
// their cursor while they type.
//
// POST writes it back. This is a local demo tool: it will only overwrite a
// persona file that already exists, only under /config/personas, and only
// after the contents pass ScreenSchema. A config that would break the app
// never reaches the disk.

import { promises as fs } from "fs";
import { ScreenSchema } from "@/lib/contract";
import {
  ConfigNotFoundError,
  assertSafeId,
  configPath,
  readConfigJson,
} from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const personaId = new URL(request.url).searchParams.get("personaId") ?? "daniel";

  try {
    const persona = assertSafeId("personaId", personaId);
    const text = await fs.readFile(
      configPath("personas", `${persona}.json`),
      "utf8"
    );
    return Response.json(
      { personaId: persona, text },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      return Response.json(
        { error: "Config not found", message: error.message },
        { status: 404 }
      );
    }
    return Response.json(
      {
        error: "Config not found",
        message: `No layout file for "${personaId}".`,
      },
      { status: 404 }
    );
  }
}

export async function POST(request: Request) {
  let body: { personaId?: string; text?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Bad request", message: "Body must be JSON." },
      { status: 400 }
    );
  }

  if (typeof body.text !== "string") {
    return Response.json(
      { error: "Bad request", message: "Expected a `text` field to write." },
      { status: 400 }
    );
  }

  let persona: string;
  try {
    persona = assertSafeId("personaId", body.personaId ?? "");
  } catch {
    return Response.json(
      { error: "Bad request", message: `"${body.personaId}" is not a persona id.` },
      { status: 400 }
    );
  }

  // Only ever overwrite a persona file that is already there. This endpoint
  // cannot create files and cannot reach outside /config/personas.
  try {
    await readConfigJson("personas", `${persona}.json`);
  } catch {
    return Response.json(
      {
        error: "Config not found",
        message: `There is no config/personas/${persona}.json to overwrite.`,
      },
      { status: 404 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text);
  } catch (error) {
    return Response.json(
      {
        error: "Invalid JSON",
        message: `Not saved — ${(error as Error).message}`,
      },
      { status: 422 }
    );
  }

  const validated = ScreenSchema.safeParse(parsed);
  if (!validated.success) {
    return Response.json(
      {
        error: "Screen failed validation",
        message: "Not saved — this config does not match the contract.",
        issues: validated.error.issues.map((issue) => ({
          path: issue.path.join(".") || "(root)",
          message: issue.message,
        })),
      },
      { status: 422 }
    );
  }

  await fs.writeFile(
    configPath("personas", `${persona}.json`),
    body.text.endsWith("\n") ? body.text : `${body.text}\n`,
    "utf8"
  );

  return Response.json({ saved: true, personaId: persona });
}
