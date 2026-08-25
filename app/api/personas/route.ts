// app/api/personas/route.ts
// Who the demo can switch between. The switcher reads this rather than holding
// a hardcoded list of three, so dropping a fourth persona config on disk puts
// a fourth button in the header.

import { listPersonaIds } from "@/lib/config";
import { loadData } from "@/lib/resolver";

export const dynamic = "force-dynamic";

export async function GET() {
  const ids = await listPersonaIds();

  const personas = await Promise.all(
    ids.map(async (id) => {
      const data = await loadData(id).catch(() => null);
      return {
        id,
        name: data?.customer?.firstName ?? id,
        summary: data?.customer?.summary ?? "",
        order: data?.order ?? 99,
        demoSignals: data?.demoSignals ?? [],
      };
    })
  );

  personas.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  return Response.json({ personas }, { headers: { "Cache-Control": "no-store" } });
}
