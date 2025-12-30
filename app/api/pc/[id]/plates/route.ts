import { parseJsonBody, routeFactory, routeResponse } from "@/lib/api";
import { Plates } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import zod from "zod";

export const POST = routeFactory(async (req, authType, tx, category_id) => {
  const data = await parseJsonBody({ ...await req.json(), category_id }, createInsertSchema(Plates));
  const [id] = await tx.insert(Plates).values(data).returning({ id: Plates.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const GET = routeFactory(async (req, authType, tx, id) => {
  return await tx.query.Plates.findMany({
    where: eq(Plates.category_id, id),
    columns: {
      id: true,
      true_depth: true,
      width: true,
      length: true
    }
  });
});
