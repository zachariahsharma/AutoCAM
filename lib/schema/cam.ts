import { getTableName, relations, SQL, sql } from "drizzle-orm";
import { decimal, foreignKey, integer, pgPolicy, pgTable, primaryKey, text, unique } from "drizzle-orm/pg-core";
import { Teams } from "./entities";
import { KeyAuthorized, UserInTeam } from "./rls";
import scopes from "../scopes";

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

function PartsKeyRLS(scope = scopes.parts.write): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${PartCategories.id} = ${Parts.category_id}
      AND ${KeyAuthorized(PartCategories.team_id, scope)}
  )
  `
}

function PartsUserRLS(): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${PartCategories.id} = ${Parts.category_id}
      AND ${UserInTeam(PartCategories.team_id)}
  )
  `
}

export const Parts = pgTable("parts", {
  id: integer().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  ticket: text().notNull(),
  quantity: integer().default(1).notNull(),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" })
}, table => [
  primaryKey({ columns: [table.id, table.category_id]}),
  pgPolicy('parts_query_key', { for: "select", using: PartsKeyRLS(scopes.parts.read) }),
  pgPolicy('parts_query_user', { for: "select", using: PartsUserRLS() }),
  pgPolicy("parts_update_key", { for: "update", using: PartsKeyRLS() }),
  pgPolicy("parts_update_user", { for: "update", using: PartsUserRLS() }),
  pgPolicy("parts_delete_key", { for: "delete", using: PartsKeyRLS() }),
  pgPolicy("parts_delete_user", { for: "delete", using: PartsUserRLS() }),
  pgPolicy('parts_insert_key', { for: 'insert', withCheck: PartsKeyRLS() }),
  pgPolicy('parts_insert_user', { for: 'insert', withCheck: PartsUserRLS() })
]);

function PlatesKeyRLS(scope = scopes.plates.write): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${PartCategories.id} = ${Plates.category_id}
      AND ${KeyAuthorized(PartCategories.team_id, scope)}
  )
  `
}

function PlatesUserRLS(): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${PartCategories.id} = ${Plates.category_id}
      AND ${UserInTeam(PartCategories.team_id)}
  )
  `
}

export const Plates = pgTable("plates", {
  id: integer().generatedAlwaysAsIdentity(),
  width: decimal().notNull(),
  length: decimal().notNull(),
  true_depth: decimal().notNull(),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" }),
  status: text({ enum: ["pending", "in progress", "completed"] }).default("pending").notNull(),
  cam_download_url: text(),
  screenshot_url: text(),
}, table => [
  primaryKey({ columns: [table.id, table.category_id] }),
  pgPolicy('plates_query_key', { for: "select", using: PlatesKeyRLS(scopes.parts.read) }),
  pgPolicy('plates_query_user', { for: "select", using: PlatesUserRLS() }),
  pgPolicy("plates_update_key", { for: "update", using: PlatesKeyRLS() }),
  pgPolicy("plates_update_user", { for: "update", using: PlatesUserRLS() }),
  pgPolicy("plates_delete_key", { for: "delete", using: PlatesKeyRLS() }),
  pgPolicy("plates_delete_user", { for: "delete", using: PlatesUserRLS() }),
  pgPolicy('plates_insert_key', { for: 'insert', withCheck: PlatesKeyRLS() }),
  pgPolicy('plates_insert_user', { for: 'insert', withCheck: PlatesUserRLS() })
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
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id)
]);

export const Machines = pgTable("machines", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  file: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id)
]);

export const Tools = pgTable("tools", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  file: text().notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" })
}, table => [
  unique().on(table.name, table.team_id)
]);

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

export const PartsRelations = relations(Parts, ({ one }) => ({
  category: one(PartCategories, {
    fields: [Parts.category_id],
    references: [PartCategories.id]
  })
}));

export const PlatesRelations = relations(Plates, ({ one }) => ({
  category: one(PartCategories, {
    fields: [Plates.category_id],
    references: [PartCategories.id]
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
