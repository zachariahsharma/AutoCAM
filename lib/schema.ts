import { user } from "@/lib/auth-schema";
import { relations } from "drizzle-orm";
import { boolean, decimal, foreignKey, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const Teams = pgTable("teams", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  number: integer().notNull(),
});

export const TeamMembers = pgTable("users", {
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  // Needs to match what's in auth-schema.ts
  user_id: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  admin: boolean().notNull().default(false),
});

export const PartCategories = pgTable("part_categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  material: text().notNull(),
  thickness: decimal({ scale: 3 }).notNull()
});

export const Parts = pgTable("parts", {
  id: integer().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  epic: text().notNull(),
  ticket: text().notNull(),
  quantity: integer().default(1).notNull(),
  category_id: integer().notNull().references(() => PartCategories.id, { onDelete: "cascade" })
}, table => [
  primaryKey({ columns: [table.id, table.category_id]})
]);

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
  primaryKey({ columns: [table.id, table.category_id] })
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

export const PartCategoriesRelations = relations(PartCategories, ({ many }) => ({
  parts: many(Parts),
  plates: many(Plates),
  partsToPlates: many(PartsToPlates),
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

export const TeamMembersRelations = relations(TeamMembers, ({ one }) => ({
  team: one(Teams, {
    fields: [TeamMembers.team_id],
    references: [Teams.id],
  }),
  user: one(user, {
    fields: [TeamMembers.user_id],
    references: [user.id],
  })
}));

export const TeamsRelations = relations(Teams, ({ many }) => ({
  users: many(user),
}));
