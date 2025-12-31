import { Parts } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import { parseJsonBody, parseJsonFile, routeFactory, routeResponse } from "@/lib/api";
import { Part, PartsCreateSchema } from "@/lib/api/parts";
import zod from "zod";

export const POST = routeFactory(async (req, authType, tx, category_id) => {
  const { data, file } = await parseJsonFile(await req.formData(), PartsCreateSchema);
  const [id] = await tx.insert(Parts).values({ ...data, file, category_id }).returning({ id: Parts.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const GET = routeFactory(async (req, authType, tx, id) => {
  return routeResponse(200, await parseJsonBody(await tx.query.Parts.findMany({
      where: eq(Parts.category_id, id),
  }), zod.array(Part)));
});