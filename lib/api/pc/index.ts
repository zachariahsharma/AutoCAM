import './assignments';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { PartCategories } from "../../db/schema/cam";
import { scopeNames } from "../../scopes";
import zod from "zod";
import { checkUserTeamTRPC, s3DeleteWithPrefix } from "../common";
import { teamIdFromDigestTRPC } from "../../auth/server";
import { and, eq } from "drizzle-orm";
import { procedure, router } from '@/lib/trpc/server';
import db from '@/lib/db';
import { TRPCError } from '@trpc/server';

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
    }),

  create: procedure.meta({
    openapi: { method: "POST", path: "/api/trpc/pc.create" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.pc.write],
    emailVerified: true
  }).input(createInsertSchema(PartCategories).extend({ team_id: zod.number().optional() }))
    .output(zod.number()).mutation(async opts => {
      const team_id = opts.input.team_id ?? await teamIdFromDigestTRPC(opts.ctx.apiKey!);
      await checkUserTeamTRPC(opts.ctx, team_id);

      const [id] = await db.insert(PartCategories).values({ ...opts.input, team_id }).returning({ id: PartCategories.id });
      return id.id;
    }),

  update: procedure.meta({
    openapi: { method: "POST", path: "/api/trpc/pc.update" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.pc.write],
    emailVerified: true
  }).input(createUpdateSchema(PartCategories).extend({ id: zod.number() }).omit({ team_id: true }))
    .mutation(async opts => {
      const pc = await db.query.PartCategories.findFirst({ where: eq(PartCategories.id, opts.input.id) });
      if (!pc) return new TRPCError({ code: "NOT_FOUND" });
      await checkUserTeamTRPC(opts.ctx, pc.team_id);
      await db.update(PartCategories).set(opts.input).where(eq(PartCategories.id, opts.input.id));
    }),

  delete: procedure.meta({
    openapi: { method: "POST", path: "/api/trpc/pc.delete" },
    authStrategies: ["user", "apiKey"],
    scopes: [scopeNames.pc.write],
    emailVerified: true
  }).input(zod.number()).mutation(async opts => {
    const pc = await db.query.PartCategories.findFirst({ where: eq(PartCategories.id, opts.input) });
    if (!pc) return new TRPCError({ code: "NOT_FOUND" });
    await checkUserTeamTRPC(opts.ctx, pc.team_id);
    await db.delete(PartCategories).where(eq(PartCategories.id, opts.input));
    await s3DeleteWithPrefix(`teams/${pc.team_id}/pc/${opts.input}/`);
  })
});
