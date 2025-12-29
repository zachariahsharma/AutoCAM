import { parseJsonBody, routeFactory } from "@/lib/api-utils";
import { BoxTubes, BoxTubesUpdateSchema } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  const body = await parseJsonBody(await req.json(), BoxTubesUpdateSchema);
  return await tx.update(BoxTubes)
    .set(body)
    .where(eq(BoxTubes.id, id))
    .returning({ id: BoxTubes.id });
}, { emailVerifiedNeeded: true });
