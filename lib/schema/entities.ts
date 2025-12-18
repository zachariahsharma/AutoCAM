import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations } from "drizzle-orm";

export const Teams = pgTable("teams", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  number: integer().notNull(),
});

export const TeamInvites = pgTable("team_invites", {
  id: uuid().primaryKey().defaultRandom(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  email: text().notNull(),
});

export const TeamMembers = pgTable("users", {
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  // Needs to match what's in auth-schema.ts
  user_id: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  admin: boolean().notNull().default(false),
});

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
  teamInvites: many(TeamInvites),
}));

export const TeamInvitesRelations = relations(TeamInvites, ({ one }) => ({
  team: one(Teams, {
    fields: [TeamInvites.team_id],
    references: [Teams.id],
  }),
}));