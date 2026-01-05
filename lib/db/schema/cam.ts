import { relations, sql, SQL } from "drizzle-orm";
import { customType, doublePrecision, integer, pgEnum, pgPolicy, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";
import { Teams } from "./entities";
import { CheckBoxTubeJobsTeams, CheckJobTeams, CheckPartsPlatesTeam, CheckToolMachinesTeam, CheckToolMaterialsTeam, KeyAuthorized, TeamFromBoxTube, TeamFromCategory, TeamFromPlate, TeamFromTool, UserInTeam, UserIsTeamAdmin } from "./rls";
import { scopeNames as scopes } from "../../scopes";

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
  pgPolicy('part_categories_query_key', { for: "select", using: KeyAuthorized(table.team_id, scopes.pc.read) }),
  pgPolicy('part_categories_query_user', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('part_categories_update_key', { for: "update", using: KeyAuthorized(table.team_id, scopes.pc.write) }),
  pgPolicy('part_categories_update_user', { for: 'update', using: UserInTeam(table.team_id) }),
  pgPolicy('part_categories_delete_key', { for: "delete", using: KeyAuthorized(table.team_id, scopes.pc.write) }),
  pgPolicy('part_categories_delete_user', { for: "delete", using: UserInTeam(table.team_id) }),
  pgPolicy('part_categories_insert_key', { for: 'insert', withCheck: KeyAuthorized(table.team_id, scopes.pc.write) }),
  pgPolicy('part_categories_insert_user', { for: 'insert', withCheck: UserInTeam(table.team_id) })
]);

export const Parts = pgTable("parts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  ticket: text().notNull(),
  quantity: integer().notNull(),
  original_quantity: integer().notNull().default(1),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" })
}, table => [
  pgPolicy('parts_query_key', { for: "select", using: KeyAuthorized(TeamFromCategory(table.category_id), scopes.parts.read) }),
  pgPolicy('parts_query_user', { for: "select", using: UserInTeam(TeamFromCategory(table.category_id)) }),
  pgPolicy("parts_update_key", { for: "update", using: KeyAuthorized(TeamFromCategory(table.category_id), scopes.parts.write) }),
  pgPolicy("parts_update_user", { for: "update", using: UserInTeam(TeamFromCategory(table.category_id)) }),
  pgPolicy("parts_delete_key", { for: "delete", using: KeyAuthorized(TeamFromCategory(table.category_id), scopes.parts.write) }),
  pgPolicy("parts_delete_user", { for: "delete", using: UserInTeam(TeamFromCategory(table.category_id)) }),
  pgPolicy('parts_insert_key', { for: 'insert', withCheck: KeyAuthorized(TeamFromCategory(table.category_id), scopes.parts.write) }),
  pgPolicy('parts_insert_user', { for: 'insert', withCheck: UserInTeam(TeamFromCategory(table.category_id)) })
]);

export const Plates = pgTable("plates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  width: doublePrecision().notNull(),
  length: doublePrecision().notNull(),
  true_depth: doublePrecision().notNull(),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" }),
}, table => [
  pgPolicy('plates_query_key', { for: "select", using: KeyAuthorized(TeamFromCategory(table.category_id), scopes.plates.read) }),
  pgPolicy('plates_query_user', { for: "select", using: UserInTeam(TeamFromCategory(table.category_id)) }),
  pgPolicy("plates_update_key", { for: "update", using: KeyAuthorized(TeamFromCategory(table.category_id), scopes.plates.write) }),
  pgPolicy("plates_update_user", { for: "update", using: UserInTeam(TeamFromCategory(table.category_id)) }),
  pgPolicy("plates_delete_key", { for: "delete", using: KeyAuthorized(TeamFromCategory(table.category_id), scopes.plates.write) }),
  pgPolicy("plates_delete_user", { for: "delete", using: UserInTeam(TeamFromCategory(table.category_id)) }),
  pgPolicy('plates_insert_key', { for: 'insert', withCheck: KeyAuthorized(TeamFromCategory(table.category_id), scopes.plates.write) }),
  pgPolicy('plates_insert_user', { for: 'insert', withCheck: UserInTeam(TeamFromCategory(table.category_id)) })
]);

export const BoxTubes = pgTable("box_tubes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  ticket: text().notNull(),
  epic: text().notNull(),
  file: bytea().notNull(),
  quantity: integer().default(1).notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  pgPolicy('box_tubes_query_user', { for: "select", using: UserInTeam(table.team_id) }),
  pgPolicy('box_tubes_query_key', { for: "select", using: KeyAuthorized(table.team_id, scopes.boxTubes.read) }),
  pgPolicy('box_tubes_update_user', { for: "update", using: UserInTeam(table.team_id) }),
  pgPolicy('box_tubes_update_key', { for: "update", using: KeyAuthorized(table.team_id, scopes.boxTubes.write) }),
  pgPolicy('box_tubes_delete_user', { for: "delete", using: UserInTeam(table.team_id) }),
  pgPolicy('box_tubes_delete_key', { for: "delete", using: KeyAuthorized(table.team_id, scopes.boxTubes.write) }),
  pgPolicy('box_tubes_insert_user', { for: "insert", withCheck: UserInTeam(table.team_id) }),
  pgPolicy('box_tubes_insert_key', { for: "insert", withCheck: KeyAuthorized(table.team_id, scopes.boxTubes.write) }),
]);

export const Materials = pgTable("materials", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id),
  pgPolicy('materials_query_user', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('materials_query_key', { for: 'select', using: KeyAuthorized(table.team_id, scopes.materials.read) }),
  pgPolicy('materials_insert_user', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('materials_insert_key', { for: 'insert', withCheck: KeyAuthorized(table.team_id, scopes.materials.write) }),
  pgPolicy('materials_update_user', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('materials_update_key', { for: 'update', using: KeyAuthorized(table.team_id, scopes.materials.write) }),
  pgPolicy('materials_delete_user', { for: 'delete', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('materials_delete_key', { for: 'delete', using: KeyAuthorized(table.team_id, scopes.materials.write) }),
]);

export const Machines = pgTable("machines", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id),
  pgPolicy('machines_query_user', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('machines_query_key', { for: 'select', using: KeyAuthorized(table.team_id, scopes.machines.read) }),
  pgPolicy('machines_insert_user', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('machines_insert_key', { for: 'insert', withCheck: KeyAuthorized(table.team_id, scopes.machines.write) }),
  pgPolicy('machines_update_user', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('machines_update_key', { for: 'update', using: KeyAuthorized(table.team_id, scopes.machines.write) }),
  pgPolicy('machines_delete_user', { for: 'delete', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('machines_delete_key', { for: 'delete', using: KeyAuthorized(table.team_id, scopes.machines.write) }),
]);

export const Tools = pgTable("tools", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id),
  pgPolicy('tools_query_user', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('tools_query_key', { for: 'select', using: KeyAuthorized(table.team_id, scopes.tools.read) }),
  pgPolicy('tools_insert_user', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tools_insert_key', { for: 'insert', withCheck: KeyAuthorized(table.team_id, scopes.tools.write) }),
  pgPolicy('tools_update_user', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tools_update_key', { for: 'update', using: KeyAuthorized(table.team_id, scopes.tools.write) }),
  pgPolicy('tools_delete_user', { for: 'delete', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tools_delete_key', { for: 'delete', using: KeyAuthorized(table.team_id, scopes.tools.write) }),
]);

export const ToolMaterials = pgTable("tool_materials", {
  tool_id: integer().notNull().references(() => Tools.id, { onDelete: "cascade" }),
  material_id: integer().notNull().references(() => Materials.id, { onDelete: "cascade" }),
}, table => [
  pgPolicy('tool_materials_insert', { for: 'insert', as: "restrictive", withCheck: CheckToolMaterialsTeam() }),
  pgPolicy('tool_materials_update', { for: 'update', as: "restrictive", using: CheckToolMaterialsTeam() }),
  pgPolicy('tool_materials_query_user', { for: 'select', using: UserInTeam(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_materials_query_key', { for: 'select', using: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.read) }),
  pgPolicy('tool_materials_insert_user', { for: 'insert', withCheck: UserIsTeamAdmin(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_materials_insert_key', { for: 'insert', withCheck: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.write) }),
  pgPolicy('tool_materials_update_user', { for: 'update', using: UserIsTeamAdmin(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_materials_update_key', { for: 'update', using: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.write) }),
  pgPolicy('tool_materials_delete_user', { for: 'delete', using: UserIsTeamAdmin(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_materials_delete_key', { for: 'delete', using: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.write) }),
]);

export const ToolMachines = pgTable("tool_machines", {
  tool_id: integer().notNull().references(() => Tools.id, { onDelete: "cascade" }),
  machine_id: integer().notNull().references(() => Machines.id, { onDelete: "cascade" })
}, table => [
  pgPolicy('tool_machines_insert', { for: 'insert', as: "restrictive", withCheck: CheckToolMachinesTeam() }),
  pgPolicy('tool_machines_update', { for: 'update', as: "restrictive", using: CheckToolMachinesTeam() }),
  pgPolicy('tool_machines_query_user', { for: 'select', using: UserInTeam(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_machines_query_key', { for: 'select', using: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.read) }),
  pgPolicy('tool_machines_insert_user', { for: 'insert', withCheck: UserIsTeamAdmin(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_machines_insert_key', { for: 'insert', withCheck: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.write) }),
  pgPolicy('tool_machines_update_user', { for: 'update', using: UserIsTeamAdmin(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_machines_update_key', { for: 'update', using: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.write) }),
  pgPolicy('tool_machines_delete_user', { for: 'delete', using: UserIsTeamAdmin(TeamFromTool(table.tool_id)) }),
  pgPolicy('tool_machines_delete_key', { for: 'delete', using: KeyAuthorized(TeamFromTool(table.tool_id), scopes.tools.write) }),
])

export const PartsToPlates = pgTable("parts_to_plates", {
  plate_id: integer().notNull().references(() => Plates.id, { onDelete: "cascade" }),
  part_id: integer().notNull().references(() => Parts.id, { onDelete: "cascade" }),
  quantity: integer().notNull()
}, table => [
  unique().on(table.plate_id, table.part_id),
  pgPolicy('parts_to_plates_insert', { for: 'insert', as: "restrictive", withCheck: CheckPartsPlatesTeam() }),
  pgPolicy('parts_to_plates_update', { for: 'update', as: "restrictive", using: CheckPartsPlatesTeam() }),
  pgPolicy('parts_to_plates_query_user', { for: 'select', using: UserInTeam(TeamFromPlate(table.plate_id)) }),
  pgPolicy('parts_to_plates_query_key', { for: 'select', using: KeyAuthorized(TeamFromPlate(table.plate_id), scopes.pc.assignments.read) }),
  pgPolicy('parts_to_plates_insert_user', { for: 'insert', withCheck: UserIsTeamAdmin(TeamFromPlate(table.plate_id)) }),
  pgPolicy('parts_to_plates_insert_key', { for: 'insert', withCheck: KeyAuthorized(TeamFromPlate(table.plate_id), scopes.pc.assignments.write) }),
  pgPolicy('parts_to_plates_update_user', { for: 'update', using: UserIsTeamAdmin(TeamFromPlate(table.plate_id)) }),
  pgPolicy('parts_to_plates_update_key', { for: 'update', using: KeyAuthorized(TeamFromPlate(table.plate_id), scopes.pc.assignments.write) }),
  pgPolicy('parts_to_plates_delete_user', { for: 'delete', using: UserIsTeamAdmin(TeamFromPlate(table.plate_id)) }),
  pgPolicy('parts_to_plates_delete_key', { for: 'delete', using: KeyAuthorized(TeamFromPlate(table.plate_id), scopes.pc.assignments.write) }),
]);

export const JobStatus = pgEnum('job_status', ["pending", "in progress", "completed"])
export const JobKind = pgEnum('job_kind', ["plate", "box_tube"])

export const Jobs = pgTable("jobs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  status: JobStatus().notNull().default("pending"),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  kind: JobKind().notNull(),
  claimed_by: text(),
  tool_id: integer().notNull().references(() => Tools.id),
  machine_id: integer().notNull().references(() => Machines.id),
  created_at: timestamp().defaultNow()
}, table => [
  pgPolicy('jobs_insert', { for: "insert", as: "restrictive", withCheck: CheckJobTeams() }),
  pgPolicy('jobs_query_user', { for: "select", using: UserInTeam(table.team_id) }),
  pgPolicy('jobs_query_key', { for: "select", using: KeyAuthorized(table.team_id, scopes.jobs.read) }),
  pgPolicy('jobs_insert_user', { for: "insert", withCheck: UserInTeam(table.team_id) }),
  pgPolicy('jobs_insert_key', { for: "insert", withCheck: KeyAuthorized(table.team_id, scopes.jobs.create) }),
  pgPolicy('jobs_delete_user', { for: "delete", using: UserInTeam(table.team_id) }),
  pgPolicy('jobs_delete_key', { for: "delete", using: KeyAuthorized(table.team_id, scopes.jobs.delete) })
]);

export const PlateJobType = pgEnum("plate_job_type", ["arrange", "cam"]);
export const PlateJobs = pgTable("plate_jobs", {
  job_id: integer().notNull().primaryKey().references(() => Jobs.id, { onDelete: "cascade" }),
  // No ON DELETE CASCADE here because we need the backend to explicitly delete the jobs entries to avoid orphaning jobs
  plate_id: integer().notNull().references(() => Plates.id),
  type: PlateJobType().notNull(),
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

export const JobsRelations = relations(Jobs, ({ one }) => ({
  machine: one(Machines, {
    fields: [Jobs.machine_id],
    references: [Machines.id]
  }),
  tool: one(Tools, {
    fields: [Jobs.tool_id],
    references: [Tools.id]
  }),
  plate_job: one(PlateJobs),
  box_tube_job: one(BoxTubeJobs)
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
