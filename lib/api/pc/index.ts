import './assignments';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { registry } from "../../openapi/registry";
import { apiKey, userSession } from "../auth";
import { PartCategories } from "../../db/schema/cam";
import { scopeNames, scopeNames as scopes } from "../../scopes";
import zod from "zod";
import { checkUserTeam, CommonAuthorization, Conflict, IDPolicy, parseSchema, registerTeamEndpoint, routeFactory, routeResponse, s3DeleteWithPrefix, ValidationError } from "../common";
import { teamIdFromDigest, teamIdFromDigestTRPC } from "../../auth/server";
import { and, eq } from "drizzle-orm";
import { procedure, router } from '@/lib/trpc/server';
import db from '@/lib/db';

const CreateSchema = createInsertSchema(PartCategories).omit({ team_id: true });
const UpdateSchema = createUpdateSchema(PartCategories).omit({ team_id: true });

registerTeamEndpoint([scopes.pc.write], {
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
});

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
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) }),
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
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) }),
  },
  responses: {
    204: {
      description: "Part category successfully deleted",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export default router({
  get: procedure.meta({
    openapi: { method: "GET", path: "/api/trpc/pc.get" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.pc.read]
  }).input(zod.object({
    material: zod.string().optional(),
    thickness: zod.number().optional(),
    team_id: zod.number().optional()
  })).output(zod.array(createSelectSchema(PartCategories).omit({ team_id: true })))
    .query(async opts => {
      opts.input.team_id ??= await teamIdFromDigestTRPC(opts.ctx.apiKey!);
      return await db.query.PartCategories.findMany({
        where: and(
          eq(PartCategories.team_id, opts.input.team_id),
          opts.input.material !== undefined ? eq(PartCategories.material, opts.input.material) : undefined,
          opts.input.thickness !== undefined ? eq(PartCategories.thickness, opts.input.thickness) : undefined
        )
      });
    })
});

export const POST = routeFactory(async (req, authType, tx, team_id) => {
  team_id ??= await teamIdFromDigest(tx, authType);
  await checkUserTeam(tx, authType, team_id);

  const data = await parseSchema(await req.json(), CreateSchema);
  const [id] = await tx.insert(PartCategories).values({ ...data, team_id }).returning({ id: PartCategories.id })
  return routeResponse(201, id);
}, {
  user: { idPolicy: IDPolicy.Required },
  apiKey: { scopes: [scopes.pc.read], idPolicy: IDPolicy.Forbidden }
});

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const pc = await tx.query.PartCategories.findFirst({ where: eq(PartCategories.id, id) });
  await checkUserTeam(tx, authType, pc?.team_id);
  const body = await parseSchema(await req.json(), UpdateSchema);
  await tx.update(PartCategories).set(body).where(eq(PartCategories.id, id)).returning({ id: PartCategories.id })
}, { user: { emailVerified: true }, apiKey: { scopes: [scopes.pc.write] } });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const pc = await tx.query.PartCategories.findFirst({ where: eq(PartCategories.id, id) });
  if (!pc) return routeResponse(404);
  await checkUserTeam(tx, authType, pc.team_id);
  await tx.delete(PartCategories).where(eq(PartCategories.id, id));
  await s3DeleteWithPrefix(`teams/${pc.team_id}/pc/${id}/`);
}, { user: { emailVerified: true }, apiKey: { scopes: [scopes.pc.write] } });
