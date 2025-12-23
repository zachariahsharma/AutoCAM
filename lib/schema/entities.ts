import { boolean, char, integer, pgPolicy, pgTable, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations, sql } from "drizzle-orm";
import { PartCategories } from "./cam";
import { TeamFromKey, UserId, UserInTeam, UserIsTeamAdmin } from "./rls";

export const Teams = pgTable("teams", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  number: integer().notNull(),
  // This will need to change
  // Do we really want to delete team if the owner deletes their account?
  created_by: text().notNull().references(() => user.id, { onDelete: "cascade" })
}, table => [
  pgPolicy('teams_query', {
    for: 'select',
    using: sql`${TeamFromKey()} = id OR ${UserInTeam(table.id)} OR owner = ${UserId()}`
  }),
  pgPolicy('teams_update', {
    for: 'update',
    using: UserIsTeamAdmin(table.id)
  }),
  pgPolicy('teams_delete', {
    for: 'delete',
    using: sql`owner = ${UserId()}`
  }),
]);

export const TeamInvites = pgTable("team_invites", {
  id: uuid().primaryKey().defaultRandom(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  email: text().notNull(),
}, table => [
  unique().on(table.team_id, table.email),
  pgPolicy('team_invites_query', {
    for: 'select',
    using: sql`${TeamFromKey()} = ${table.team_id} OR ${UserInTeam(table.team_id)}`
  }),
  pgPolicy('team_invites_insert', {
    for: 'insert',
    withCheck: sql`${TeamFromKey()} = ${table.team_id} OR ${UserIsTeamAdmin(table.team_id)}`
  }),
  pgPolicy('team_invites_update', {
    for: 'update',
    using: sql`false`
  }),
  pgPolicy('team_invites_delete', {
    for: 'delete',
    using: sql`${TeamFromKey()} = ${table.team_id} OR ${UserIsTeamAdmin(table.team_id)}`
  })
]);

export const TeamMembers = pgTable("team_members", {
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  // Needs to match what's in auth-schema.ts
  user_id: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  admin: boolean().notNull().default(false),
}, table => [
  primaryKey({ columns: [table.team_id, table.user_id] })
]);

export const TeamKeys = pgTable("team_keys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  digest: char({ length: 64 }).notNull(),
  name: text().notNull()
}, table => [
  unique().on(table.team_id, table.name)
]);

export const TeamRunners = pgTable("team_runners", {
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  digest: char({ length: 64 }).notNull(),
  name: text().notNull(),
}, table => [
  primaryKey({ columns: [table.team_id, table.name] })
]);

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

export const TeamsRelations = relations(Teams, ({ many, one }) => ({
  teamMembers: many(TeamMembers),
  teamInvites: many(TeamInvites),
  runners: many(TeamRunners),
  partCategories: many(PartCategories),
  keys: many(TeamKeys),
  creator: one(user, {
    fields: [Teams.created_by],
    references: [user.id],
  })
}));

export const TeamInvitesRelations = relations(TeamInvites, ({ one }) => ({
  team: one(Teams, {
    fields: [TeamInvites.team_id],
    references: [Teams.id],
  }),
}));

export const TeamKeysRelations = relations(TeamKeys, ({ one }) => ({
  team: one(Teams, {
    fields: [TeamKeys.team_id],
    references: [Teams.id]
  })
}));

export const TeamRunnersRelations = relations(TeamRunners, ({ one }) => ({
  team: one(Teams, {
    fields: [TeamRunners.team_id],
    references: [Teams.id]
  })
}));