import { Parts } from "@/lib/db/schema/cam";
import { eq } from "drizzle-orm";
import { parseJsonFile, routeFactory, routeResponse } from "@/lib/api";

export const POST = routeFactory(async (req, authType, tx, category_id) => {
  const data = await parseJsonFile(
    await req.formData(), PartsInsertSchema,
    async (data, file) => ({ ...data, file, category_id })
  );
  const [id] = await tx.insert(Parts).values(data).returning({ id: Parts.id });
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const GET = routeFactory(async (req, authType, tx, id) => {
  return routeResponse(200, await tx.query.Parts.findMany({
      where: eq(Parts.category_id, id),
      columns: {
        epic: true,
        name: true,
        quantity: true,
        id: true,
        ticket: true,
      }
  }));
});