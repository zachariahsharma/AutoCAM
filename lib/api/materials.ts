import { Materials } from "@/lib/db/schema/core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { scopeNames } from "../scopes";
import { checkUserTeamTRPC } from "./common";
import { teamIdFromDigestTRPC } from "../auth/server";
import { eq } from "drizzle-orm";
import { procedure, router } from "../trpc/server";
import db from "../db";
import { TRPCError } from "@trpc/server";

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

  delete: procedure.meta({
    openapi: { method: "POST", path: "/aip/trpc/materials.delete" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.materials.write],
    emailVerified: true
  }).input(zod.number()).mutation(async opts => {
    const material = await db.query.Materials.findFirst({ where: eq(Materials.id, opts.input) });
    if (!material) throw new TRPCError({ code: "NOT_FOUND" });
    await checkUserTeamTRPC(opts.ctx, material.team_id, true);
    await db.delete(Materials).where(eq(Materials.id, opts.input));
  })
});
