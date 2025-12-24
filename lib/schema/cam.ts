import { getTableName, relations, SQL, sql } from "drizzle-orm";
import { decimal, foreignKey, integer, pgPolicy, pgTable, primaryKey, text, unique } from "drizzle-orm/pg-core";
import { Teams } from "./entities";
import { TeamFromKey, UserInTeam } from "./rls";

function PartCategoriesRLS(): SQL<boolean> {
  return sql`${TeamFromKey()} = ${PartCategories.team_id} OR ${UserInTeam(PartCategories.team_id)}`
}

export const PartCategories = pgTable("part_categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  material: text().notNull(),
  thickness: decimal({ scale: 3 }).notNull(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
}, table => [
  unique().on(table.team_id, table.material, table.thickness),
  pgPolicy('part_categories_access', {
    using: PartCategoriesRLS(),
  }),
  pgPolicy('part_categories_insert', {
    for: 'insert',
    withCheck: PartCategoriesRLS()
  })
]);

function PartsRLS(): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${PartCategories.id} = ${Parts.category_id}
      AND (${TeamFromKey()} = ${PartCategories.team_id} OR ${UserInTeam(PartCategories.team_id)})
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
  pgPolicy('parts_access', {
    using: PartsRLS(),
  }),
  pgPolicy('parts_insert', {
    for: 'insert',
    withCheck: PartsRLS()
  })
]);

function PlatesRLS(): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${PartCategories.id} = ${Plates.category_id}
      AND (${TeamFromKey()} = ${PartCategories.team_id} OR ${UserInTeam(PartCategories.team_id)})
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
  pgPolicy('plates_access', {
    using: PlatesRLS(),
  }),
  pgPolicy('plates_insert', {
    for: 'insert',
    withCheck: PlatesRLS()
  })
]);

export const BoxTubes = pgTable("box_tubes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  quantity: integer().default(1).notNull(),
  status: text({ enum: ["pending", "in progress", "completed"] }).default("pending").notNull(),
  cam_download_url: text(),
});

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
