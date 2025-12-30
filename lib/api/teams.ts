import "@/lib/openapi/registry";
import { Teams } from "@/lib/db/schema/entities";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";

export const TeamsCreateSchema = createInsertSchema(Teams).omit({ owner: true }).openapi("TeamsCreate");
export const TeamsUpdateSchema = createUpdateSchema(Teams).extend({ owner: zod.email().optional() }).openapi("TeamsUpdate");
export const TeamsGetSchema = createSelectSchema(Teams).openapi("TeamsGet");
