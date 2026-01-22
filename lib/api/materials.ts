import { Materials } from "@/lib/db/schema/core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames, scopeNames as scopes } from "../scopes";
import { checkUserTeam, checkUserTeamTRPC, CommonAuthorization, routeFactory, routeResponse, ValidationError } from "./common";
import { teamIdFromDigestTRPC } from "../auth/server";
import { eq } from "drizzle-orm";
import { procedure, router } from "../trpc/server";
import db from "../db";
import { TRPCError } from "@trpc/server";

registry.registerPath({
  method: "delete",
  path: "/api/material/{id}",
  tags: ["Materials"],
  summary: "Delete Material",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.materials.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the material" }) }),
  },
  responses: {
    204: {
      description: "Material successfully deleted",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export default router({
  get: procedure.meta({
    openapi: { method: "GET", path: "/api/trpc/materials.get" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.materials.read]
  }).input(zod.number().optional())
    .output(zod.array(createSelectSchema(Materials).omit({ team_id: true })))
    .query(async opts => {
      opts.input ??= await teamIdFromDigestTRPC(opts.ctx.apiKey!);
      return await db.query.Materials.findMany({ where: eq(Materials.team_id, opts.input) });
    }),

  get_single: procedure.meta({
    openapi: { method: "GET", path: "/api/trpc/materials.get_single" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.materials.read],
  }).input(zod.number())
    .output(createSelectSchema(Materials).omit({ team_id: true }))
    .query(async opts => {
      const material = await db.query.Materials.findFirst({ where: eq(Materials.id, opts.input) });
      if (!material) throw new TRPCError({ code: "NOT_FOUND" });
      await checkUserTeamTRPC(opts.ctx, material.team_id);
      return material;
    }),

  create: procedure.meta({
    openapi: { method: "POST", path: "/api/trpc/materials.create" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.materials.write],
    emailVerified: true
  }).input(createInsertSchema(Materials).extend({ team_id: zod.number().optional() })).output(zod.number())
    .mutation(async opts => {
      opts.input.team_id ??= await teamIdFromDigestTRPC(opts.ctx.apiKey!);
      await checkUserTeamTRPC(opts.ctx, opts.input.team_id, true);
      const team_id = opts.input.team_id!;
      const [id] = await db.insert(Materials).values({ ...opts.input, team_id }).returning({ id: Materials.id });
      return id.id;
    }),

  update: procedure.meta({
      openapi: { method: "POST", path: "/api/trpc/materials.update" },
      authStrategies: ["user", "apiKey"],
      scopes: [scopeNames.materials.write],
      emailVerified: true
    }).input(createUpdateSchema(Materials).extend({ id: zod.number() }))
    .mutation(async opts => {
      const material = await db.query.Materials.findFirst({ where: eq(Materials.id, opts.input.id) });
      if (!material) throw new TRPCError({ code: "NOT_FOUND" });
      await checkUserTeamTRPC(opts.ctx, material.team_id, true);
      await db.update(Materials).set(opts.input).where(eq(Materials.id, opts.input.id));
    }),
});

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const material = await tx.query.Materials.findFirst({ where: eq(Materials.id, id) });
  await checkUserTeam(tx, authType, material?.team_id, true);
  await tx.delete(Materials).where(eq(Materials.id, id));
}, { user: { emailVerified: true }, apiKey: { scopes: [scopes.materials.write] } });
