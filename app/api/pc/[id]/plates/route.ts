import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { Plate, PlatesCreateSchema } from "@/lib/api/plates";
import { Plates } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import zod from "zod";

export const POST = routeFactory(async (req, authType, tx, category_id) => {
  const data = await parseJsonBody(await req.json(), PlatesCreateSchema);
  const [id] = await tx.insert(Plates).values({ ...data, category_id }).returning({ id: Plates.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const GET = routeFactory(async (req, authType, tx, id) => {
  return routeResponse(200, await parseJsonBody(await tx.query.Plates.findMany({
    where: eq(Plates.category_id, id),
  }), zod.array(Plate)));
});
