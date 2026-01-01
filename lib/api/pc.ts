import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { registry } from "../openapi/registry";
import { apiKey, userSession } from "./auth";
import { PartCategories } from "../db/schema/cam";
import { scopeNames as scopes } from "../scopes";
import zod from "zod";
import { CommonAuthorization, Conflict, registerTeamEndpoint, ValidationError } from "./common";
import { parseJsonBody, routeFactory, routeResponse } from ".";
import { teamIdFromDigest } from "../auth/server";
import { and, eq } from "drizzle-orm";

const CreateSchema = createInsertSchema(PartCategories).omit({ team_id: true });
const UpdateSchema = createUpdateSchema(PartCategories).omit({ team_id: true });
const PartCategory = createSelectSchema(PartCategories).omit({ team_id: true }).meta({ id: "Part Category" });
const SearchParams = zod.object({
  material: zod.string().optional(),
  thickness: zod.coerce.number().positive().optional()
});

registerTeamEndpoint({
  method: "get",
  path: "/api/pc",
  tags: ["Part Categories"],
  summary: "Get Part Categories",
  request: {
    query: SearchParams
  },
  responses: {
    200: {
      description: "This endpoint returns the part categories from the given team",
      content: {
        "application/json": {
          schema: zod.array(PartCategory)
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
}, [scopes.pc.read]);

registerTeamEndpoint({
  method: "post",
  path: "/api/pc",
  tags: ["Part Categories"],
  summary: "Create Part Category",
  description: "This endpoint requires the user's email to be verified",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created part category",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...Conflict
  }
}, [scopes.pc.write]);

registry.registerPath({
  method: "patch",
  path: "/api/pc/{id}",
  tags: ["Part Categories"],
  summary: "Update Part Category",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.pc.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Part category successfully updated",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/pc/{id}",
  tags: ["Part Categories"],
  summary: "Delete Part Category",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.pc.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().meta({ description: "ID of the part category" }) }),
  },
  responses: {
    204: {
      description: "Part category successfully deleted",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  id ??= await teamIdFromDigest(tx, authType);
  const params = req.nextUrl.searchParams;

  const data = await parseJsonBody({
    material: params.get("material")?.toString(),
    thickness: params.get("thickness")?.toString()
  }, SearchParams);
  return routeResponse(200, await parseJsonBody(await tx.query.PartCategories.findMany({
    where: and(
      eq(PartCategories.team_id, id),
      data.material !== undefined ? eq(PartCategories.material, data.material) : undefined,
      data.thickness ? eq(PartCategories.thickness, data.thickness) : undefined
    )
  }), zod.array(PartCategory)))
});

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);

  const data = await parseJsonBody(await req.json(), CreateSchema);
  const [id] = await tx.insert(PartCategories).values({ ...data, team_id }).returning({ id: PartCategories.id })
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const body = await parseJsonBody(await req.json(), UpdateSchema);
  return tx.update(PartCategories).set(body).where(eq(PartCategories.id, id)).returning({ id: PartCategories.id })
}, { emailVerifiedNeeded: true });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  return tx.delete(PartCategories).where(eq(PartCategories.id, id)).returning({ id: PartCategories.id });
}, { emailVerifiedNeeded: true });
