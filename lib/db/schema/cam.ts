import { eq, relations, sql, SQL } from "drizzle-orm";
import { customType, doublePrecision, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { TeamKeys, Teams } from "./entities";

const bytea = customType<{ data: ArrayBuffer; driverData: Buffer }>({
  dataType() { return "bytea"; },
  toDriver(value) { return Buffer.from(value); },
  fromDriver(value) {
    if (value.buffer instanceof ArrayBuffer)
      return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    return new Uint8Array(value).buffer;
  }
});

export const PartCategories = pgTable("part_categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  material: text().notNull(),
  thickness: doublePrecision().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
}, table => [
  unique().on(table.team_id, table.material, table.thickness),
]);

export const Parts = pgTable("parts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  ticket: text().notNull(),
  quantity: integer().notNull(),
  original_quantity: integer().notNull().default(1),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" })
});

export const Plates = pgTable("plates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  width: doublePrecision().notNull(),
  length: doublePrecision().notNull(),
  true_depth: doublePrecision().notNull(),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" }),
});

export const BoxTubes = pgTable("box_tubes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  ticket: text().notNull(),
  epic: text().notNull(),
  file: bytea().notNull(),
  quantity: integer().default(1).notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
});

export const Materials = pgTable("materials", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id),
]);

export const Machines = pgTable("machines", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id),
]);

export const Tools = pgTable("tools", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id),
]);

export const ToolMaterials = pgTable("tool_materials", {
  tool_id: integer().notNull().references(() => Tools.id, { onDelete: "cascade" }),
  material_id: integer().notNull().references(() => Materials.id, { onDelete: "cascade" }),
});

export const ToolMachines = pgTable("tool_machines", {
  tool_id: integer().notNull().references(() => Tools.id, { onDelete: "cascade" }),
  machine_id: integer().notNull().references(() => Machines.id, { onDelete: "cascade" })
})

export const PartsToPlates = pgTable("parts_to_plates", {
  plate_id: integer().notNull().references(() => Plates.id, { onDelete: "cascade" }),
  part_id: integer().notNull().references(() => Parts.id, { onDelete: "cascade" }),
  quantity: integer().notNull()
}, table => [
  unique().on(table.plate_id, table.part_id),
]);

export const JobStatus = pgEnum('job_status', ["pending", "in progress", "completed"])
export const JobKind = pgEnum('job_kind', ["plate:arrange", "plate:cam", "box_tube"])

export const Jobs = pgTable("jobs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  status: JobStatus().notNull().default("pending"),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  kind: JobKind().notNull(),
  created_at: timestamp().defaultNow(),
  claimed_by: text().notNull().references(() => TeamKeys.digest),
  payload: jsonb().notNull(),
  response: jsonb()
}, table => [
  // Make sure that a single runner can't pick up more than one job at a time
  uniqueIndex("claimed_by_index").on(table.claimed_by).where(eq(table.status, sql`'in progress'`)),
]);

export const PlateJobs = pgTable("plate_jobs", {
  job_id: integer().notNull().primaryKey().references(() => Jobs.id, { onDelete: "cascade" }),
  // No ON DELETE CASCADE here because we need the backend to explicitly delete the jobs entries to avoid orphaning jobs
  plate_id: integer().notNull().references(() => Plates.id),
});

export const BoxTubeJobs = pgTable("box_tube_jobs", {
  job_id: integer().notNull().primaryKey().references(() => Jobs.id, { onDelete: "cascade" }),
  // No ON DELETE CASCADE here because we need the backend to explicitly delete the jobs entries to avoid orphaning jobs
  box_tube_id: integer().notNull().references(() => BoxTubes.id),
});

export const PartsRelations = relations(Parts, ({ one }) => ({
  category: one(PartCategories, {
    fields: [Parts.category_id],
    references: [PartCategories.id]
  })
}));

export const PlatesRelations = relations(Plates, ({ one, many }) => ({
  category: one(PartCategories, {
    fields: [Plates.category_id],
    references: [PartCategories.id]
  }),
  assignments: many(PartsToPlates),
  jobs: many(PlateJobs)
}));

export const PlateJobsRelations = relations(PlateJobs, ({ one }) => ({
  job: one(Jobs, {
    fields: [PlateJobs.job_id],
    references: [Jobs.id]
  }),
  plate: one(Plates, {
    fields: [PlateJobs.plate_id],
    references: [Plates.id]
  })
}));

export const BoxTubeJobsRelations = relations(BoxTubeJobs, ({ one }) => ({
  job: one(Jobs, {
    fields: [BoxTubeJobs.job_id],
    references: [Jobs.id]
  }),
  box_tube: one(BoxTubes, {
    fields: [BoxTubeJobs.box_tube_id],
    references: [BoxTubes.id]
  })
}));

export const PartCategoriesRelations = relations(PartCategories, ({ many, one }) => ({
  parts: many(Parts),
  plates: many(Plates),
  team: one(Teams, {
    fields: [PartCategories.team_id],
    references: [Teams.id]
  })
}));

export const PartsToPlatesRelations = relations(PartsToPlates, ({ one }) => ({
  part: one(Parts, {
    fields: [PartsToPlates.part_id],
    references: [Parts.id]
  }),
  plate: one(Plates, {
    fields: [PartsToPlates.plate_id],
    references: [Plates.id]
  }),
}));

export const BoxTubesRelations = relations(BoxTubes, ({ one, many }) => ({
  jobs: many(BoxTubeJobs),
  team: one(Teams, {
    fields: [BoxTubes.team_id],
    references: [Teams.id]
  })
}));

export const MaterialsRelations = relations(Materials, ({ one, many }) => ({
  team: one(Teams, {
    fields: [Materials.team_id],
    references: [Teams.id]
  }),
  toolMaterials: many(ToolMaterials)
}));

export const MachinesRelations = relations(Machines, ({ one, many }) => ({
  team: one(Teams, {
    fields: [Machines.team_id],
    references: [Teams.id]
  }),
  toolMachines: many(ToolMachines)
}));

export const ToolsRelations = relations(Tools, ({ one, many }) => ({
  team: one(Teams, {
    fields: [Tools.team_id],
    references: [Teams.id]
  }),
  toolMachines: many(ToolMachines),
  toolMaterials: many(ToolMaterials)
}))

export const ToolMachinesRelations = relations(ToolMachines, ({ one }) => ({
  tool: one(Tools, {
    fields: [ToolMachines.tool_id],
    references: [Tools.id]
  }),
  machine: one(Machines, {
    fields: [ToolMachines.machine_id],
    references: [Machines.id]
  })
}))

export const ToolMaterialsRelations = relations(ToolMaterials, ({ one }) => ({
  tool: one(Tools, {
    fields: [ToolMaterials.tool_id],
    references: [Tools.id]
  }),
  material: one(Materials, {
    fields: [ToolMaterials.material_id],
    references: [Materials.id]
  })
}))
