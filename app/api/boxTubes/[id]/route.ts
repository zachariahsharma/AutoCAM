import { parseJsonBody, routeFactory } from "@/lib/api";
import { BoxTubesUpdateSchema } from "@/lib/api/boxTubes";
import { BoxTubes } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), BoxTubesUpdateSchema);
  return await tx.update(BoxTubes)
    .set(body)
    .where(eq(BoxTubes.id, id))
    .returning({ id: BoxTubes.id });
}, { emailVerifiedNeeded: true });
