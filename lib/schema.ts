import { char, decimal, integer, pgTable, text } from "drizzle-orm/pg-core";

export const partCategoriesTable = pgTable("part_categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  material: char({ length: 7 }).notNull(),
  thickness: decimal({ scale: 3 }).notNull()
});

export const partsTable = pgTable("parts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  child: text().notNull(),
  quantity: integer().default(1).notNull(),
  category_id: integer().references(() => partCategoriesTable.id)
});

export const platesTable = pgTable("plates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  width: decimal().notNull(),
  length: decimal().notNull(),
  true_depth: decimal().notNull(),
  category_id: integer().references(() => partCategoriesTable.id)
});

export const partsToPlatesTable = pgTable("parts_to_plates", {
  plate_id: integer().references(() => platesTable.id),
  part_id: integer().references(() => partsTable.id),
  quantity: integer().notNull()
});