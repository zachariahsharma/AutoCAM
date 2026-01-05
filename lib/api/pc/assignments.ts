import { registry } from "@/lib/openapi/registry";
import zod from "zod";
import { apiKey, userSession } from "../auth";
import { scopeNames as scopes } from "@/lib/scopes";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { Parts, PartsToPlates, Plates } from "@/lib/db/schema/cam";
import { CommonAuthorization, ValidationError } from "../common";
import { parseJsonBody, routeFactory, routeResponse } from "..";
import { and, eq, inArray } from "drizzle-orm";

const CreateSchema = createInsertSchema(PartsToPlates);
const Assignment = createSelectSchema(PartsToPlates).openapi("Part Category Assignment");

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
  const parts = (await tx.query.Parts.findMany({
    where: eq(Parts.category_id, id),
    columns: { id: true }
  })).map(x => x.id);
  const plates = (await tx.query.Parts.findMany({
    where: eq(Plates.category_id, id),
    columns: { id: true }
  })).map(x => x.id);
  return routeResponse(200, await tx.query.PartsToPlates.findMany({
    where: and(
      inArray(PartsToPlates.part_id, parts),
      inArray(PartsToPlates.plate_id, plates)
    )
  }));
}, { requiredScopes: [scopes.pc.assignments.read] });

export const PUT = routeFactory(async (req, authType, tx) => {
  const body = await parseJsonBody(await req.json(), CreateSchema);
  if (body.quantity > 0) {
    await tx.insert(PartsToPlates).values(body)
      .onConflictDoUpdate({ target: [PartsToPlates.plate_id, PartsToPlates.part_id], set: body });
  } else {
    await tx.delete(PartsToPlates).where(and(
      eq(PartsToPlates.part_id, body.part_id),
      eq(PartsToPlates.plate_id, body.plate_id)
    ));
  }
  return routeResponse(204);
}, { emailVerifiedNeeded: true, requiredScopes: [scopes.pc.assignments.write] });