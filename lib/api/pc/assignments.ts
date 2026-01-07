import { registry } from "@/lib/openapi/registry";
import zod from "zod";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { PartCategories, Parts, PartCategoryAssignments, Plates } from "@/lib/db/schema/cam";
import { checkUserTeam, CommonAuthorization, parseJsonBody, routeFactory, routeResponse, ValidationError } from "../common";
import { and, eq, inArray } from "drizzle-orm";

const CreateSchema = createInsertSchema(PartCategoryAssignments);
const Assignment = createSelectSchema(PartCategoryAssignments).openapi("Part Category Assignment");

registry.registerPath({
  method: "get",
  path: "/api/pc/{id}/assignments",
  tags: ["Part Category Assignments"],
  summary: "Get Part Category Assignments",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.pc.assignments.read] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the assignments of parts -> plates for a specified part category",
      content: {
        "application/json": {
          schema: zod.array(Assignment)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "put",
  path: "/api/pc/{id}/assignments",
  tags: ["Part Category Assignments"],
  summary: "Modify Part Category Assignments",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.pc.assignments.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) }),
    body: {
      content: {
        "application/json": {
          schema: CreateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "The assignment was modified (inserted, updated, deleted) successfully"
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  // FIXME: Might need to add a category_id column to the parts to plates table
  if (!id) return routeResponse(422);
  const pc = await tx.query.PartCategories.findFirst({ where: eq(PartCategories.id, id) });
  await checkUserTeam(tx, authType, pc?.team_id);
  const parts = (await tx.query.Parts.findMany({
    where: eq(Parts.category_id, id),
    columns: { id: true }
  })).map(x => x.id);
  const plates = (await tx.query.Parts.findMany({
    where: eq(Plates.category_id, id),
    columns: { id: true }
  })).map(x => x.id);
  return routeResponse(200, await tx.query.PartCategoryAssignments.findMany({
    where: and(
      inArray(PartCategoryAssignments.part_id, parts),
      inArray(PartCategoryAssignments.plate_id, plates)
    )
  }));
}, { user: {}, apiKey: { scopes: [scopes.pc.assignments.read] } });

export const PUT = routeFactory(async (req, authType, tx) => {
  const body = await parseJsonBody(await req.json(), CreateSchema);
  const plate = await tx.query.Plates.findFirst({
    where: eq(Plates.id, body.plate_id),
    with: { category: true }
  });
  await checkUserTeam(tx, authType, plate?.category.team_id)
  if (body.quantity > 0) {
    await tx.insert(PartCategoryAssignments).values(body)
      .onConflictDoUpdate({ target: [PartCategoryAssignments.plate_id, PartCategoryAssignments.part_id], set: body });
  } else {
    await tx.delete(PartCategoryAssignments).where(and(
      eq(PartCategoryAssignments.part_id, body.part_id),
      eq(PartCategoryAssignments.plate_id, body.plate_id)
    ));
  }
  return routeResponse(204);
}, { user: { emailVerified: true }, apiKey: { scopes: [scopes.pc.assignments.write] } });