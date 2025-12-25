import { eq, getTableName, Many, relations, SQL, sql } from "drizzle-orm";
import { decimal, foreignKey, integer, pgEnum, pgPolicy, pgTable, primaryKey, text, unique } from "drizzle-orm/pg-core";
import { Teams } from "./entities";
import { KeyAuthorized, UserInTeam, UserIsTeamAdmin } from "./rls";
import scopes from "../scopes";

function TeamFromCategoryId(cid: any) {
  return sql`
  (
    SELECT ${PartCategories.team_id}
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${eq(PartCategories.id, cid)}
  )
  `
}

export const PartCategories = pgTable("part_categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  material: text().notNull(),
  thickness: decimal({ scale: 3 }).notNull(),
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
  id: integer().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  ticket: text().notNull(),
  quantity: integer().default(1).notNull(),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" })
}, table => [
  primaryKey({ columns: [table.id, table.category_id]}),
  pgPolicy('parts_query_key', { for: "select", using: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.parts.read) }),
  pgPolicy('parts_query_user', { for: "select", using: UserInTeam(TeamFromCategoryId(table.category_id)) }),
  pgPolicy("parts_update_key", { for: "update", using: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.parts.write) }),
  pgPolicy("parts_update_user", { for: "update", using: UserInTeam(TeamFromCategoryId(table.category_id)) }),
  pgPolicy("parts_delete_key", { for: "delete", using: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.parts.write) }),
  pgPolicy("parts_delete_user", { for: "delete", using: UserInTeam(TeamFromCategoryId(table.category_id)) }),
  pgPolicy('parts_insert_key', { for: 'insert', withCheck: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.parts.write) }),
  pgPolicy('parts_insert_user', { for: 'insert', withCheck: UserInTeam(TeamFromCategoryId(table.category_id)) })
]);

export const Plates = pgTable("plates", {
  id: integer().generatedAlwaysAsIdentity(),
  width: decimal().notNull(),
  length: decimal().notNull(),
  true_depth: decimal().notNull(),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" }),
}, table => [
  primaryKey({ columns: [table.id, table.category_id] }),
  pgPolicy('plates_query_key', { for: "select", using: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.plates.read) }),
  pgPolicy('plates_query_user', { for: "select", using: UserInTeam(TeamFromCategoryId(table.category_id)) }),
  pgPolicy("plates_update_key", { for: "update", using: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.plates.write) }),
  pgPolicy("plates_update_user", { for: "update", using: UserInTeam(TeamFromCategoryId(table.category_id)) }),
  pgPolicy("plates_delete_key", { for: "delete", using: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.plates.write) }),
  pgPolicy("plates_delete_user", { for: "delete", using: UserInTeam(TeamFromCategoryId(table.category_id)) }),
  pgPolicy('plates_insert_key', { for: 'insert', withCheck: KeyAuthorized(TeamFromCategoryId(table.category_id), scopes.plates.write) }),
  pgPolicy('plates_insert_user', { for: 'insert', withCheck: UserInTeam(TeamFromCategoryId(table.category_id)) })
]);

export const BoxTubes = pgTable("box_tubes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  quantity: integer().default(1).notNull(),
  status: text({ enum: ["pending", "in progress", "completed"] }).default("pending").notNull(),
  cam_download_url: text(),
});

export const Materials = pgTable("materials", {
  id: integer().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  primaryKey({ columns: [table.id, table.team_id] }),
  unique().on(table.name, table.team_id),
  pgPolicy('materials_query', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('materials_insert', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('materials_update', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('materials_delete', { for: 'delete', using: UserIsTeamAdmin(table.team_id) })
]);

export const Machines = pgTable("machines", {
  id: integer().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  file: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  primaryKey({ columns: [table.id, table.team_id] }),
  unique().on(table.name, table.team_id),
  pgPolicy('machines_query', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('machines_insert', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('machines_update', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('machines_delete', { for: 'delete', using: UserIsTeamAdmin(table.team_id) })
]);

export const Tools = pgTable("tools", {
  id: integer().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  file: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  primaryKey({ columns: [table.id, table.team_id] }),
  unique().on(table.name, table.team_id),
  pgPolicy('tools_query', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('tools_insert', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tools_update', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tools_delete', { for: 'delete', using: UserIsTeamAdmin(table.team_id) })
]);

export const ToolMaterials = pgTable("tool_materials", {
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  tool_id: integer().notNull(),
  material_id: integer().notNull(),
}, table => [
  foreignKey({
    columns: [table.material_id, table.team_id],
    foreignColumns: [Materials.id, Materials.team_id]
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tool_id, table.team_id],
    foreignColumns: [Tools.id, Tools.team_id]
  }).onDelete("cascade"),
  pgPolicy('tool_materials_query', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('tool_materials_insert', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tool_materials_update', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tool_materials_delete', { for: 'delete', using: UserIsTeamAdmin(table.team_id) })
]);

export const ToolMachines = pgTable("tool_machines", {
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  tool_id: integer().notNull(),
  machine_id: integer().notNull()
}, table => [
  foreignKey({
    columns: [table.machine_id, table.team_id],
    foreignColumns: [Machines.id, Machines.team_id]
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tool_id, table.team_id],
    foreignColumns: [Tools.id, Tools.team_id]
  }).onDelete("cascade"),
  pgPolicy('tools_machines_query', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('tools_machines_insert', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tools_machines_update', { for: 'update', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('tools_machines_delete', { for: 'delete', using: UserIsTeamAdmin(table.team_id) })
])

export const PartsToPlates = pgTable("parts_to_plates", {
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" }),
  plate_id: integer().notNull(),
  part_id: integer().notNull(),
  quantity: integer().notNull()
}, table => [
  foreignKey({
    columns: [table.part_id, table.category_id],
    foreignColumns: [Parts.id, Parts.category_id],
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.plate_id, table.category_id],
    foreignColumns: [Plates.id, Plates.category_id],
  }).onDelete("cascade"),
]);

const JobStatus = pgEnum('job_status', ["pending", "in progress", "completed"])

export const PlateJobs = pgTable("part_jobs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  status: JobStatus().notNull().default("pending"),
  plate_id: integer().notNull().references(() => Plates.id),
  machine_id: integer().notNull().references(() => Machines.id),
  cam_download: text(),
  screenshot_url: text()
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
  jobs: many(PlateJobs)
}));

export const PlateJobsRelations = relations(PlateJobs, ({ one }) => ({
  plate: one(Plates, {
    fields: [PlateJobs.plate_id],
    references: [Plates.id]
  }),
  machine: one(Machines, {
    fields: [PlateJobs.machine_id],
    references: [Machines.id]
  })
}));

export const PartCategoriesRelations = relations(PartCategories, ({ many, one }) => ({
  parts: many(Parts),
  plates: many(Plates),
  partsToPlates: many(PartsToPlates),
  team: one(Teams, {
    fields: [PartCategories.team_id],
    references: [Teams.id]
  })
}));

export const PartsToPlatesRelations = relations(PartsToPlates, ({ one }) => ({
  part: one(Parts, {
    fields: [PartsToPlates.part_id, PartsToPlates.category_id],
    references: [Parts.id, Parts.category_id]
  }),
  plate: one(Plates, {
    fields: [PartsToPlates.plate_id, PartsToPlates.category_id],
    references: [Plates.id, Plates.category_id]
  }),
  category: one(PartCategories, {
    fields: [PartsToPlates.category_id],
    references: [PartCategories.id],
  }),
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
