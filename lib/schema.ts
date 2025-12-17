import { relations } from "drizzle-orm";
import { decimal, integer, pgTable, text } from "drizzle-orm/pg-core";

export const PartCategories = pgTable("part_categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  material: text().notNull(),
  thickness: decimal({ scale: 3 }).notNull()
});

export const Parts = pgTable("parts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  ticket: text().notNull(),
  quantity: integer().default(1).notNull(),
  category_id: integer().notNull().references(() => PartCategories.id)
});

export const Plates = pgTable("plates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  width: decimal().notNull(),
  length: decimal().notNull(),
  true_depth: decimal().notNull(),
  category_id: integer().notNull().references(() => PartCategories.id)
});

export const PartsToPlates = pgTable("parts_to_plates", {
  plate_id: integer().notNull().references(() => Plates.id),
  part_id: integer().notNull().references(() => Parts.id),
  quantity: integer().notNull()
});

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

export const PartCategoriesRelations = relations(PartCategories, ({ many }) => ({
  parts: many(Parts),
  plates: many(Plates),
}));

export const PartsToPlatesRelations = relations(PartsToPlates, ({ one }) => ({
  part: one(Parts, {
    fields: [PartsToPlates.plate_id],
    references: [Parts.id]
  }),
  plate: one(Plates, {
    fields: [PartsToPlates.plate_id],
    references: [Plates.id]
  }),
}));