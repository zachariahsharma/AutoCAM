import { boolean, char, integer, json, pgPolicy, pgTable, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { getTableName, relations, sql } from "drizzle-orm";
import { Machines, Materials, PartCategories, Tools, BoxTubes } from "./cam";
import { KeyAuthorized, KeyDigest, UserId, UserInTeam, UserIsTeamAdmin } from "./rls";
import { scopeNames as scopes } from "../../scopes";

export const Teams = pgTable("teams", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  owner: text().notNull().references(() => user.id),
  logo: text()
}, table => [
  pgPolicy('teams_query_key', { for: 'select', using: KeyAuthorized(table.id, scopes.teams.read) }),
  pgPolicy('teams_query_user', { for: 'select', using: sql`${UserInTeam(table.id)} OR owner = ${UserId()}` }),
  pgPolicy('teams_update', { for: 'update', using: UserIsTeamAdmin(table.id) }),
  pgPolicy('teams_delete', { for: 'delete', using: sql`owner = ${UserId()}` }),
  pgPolicy('teams_insert', { for: 'insert', withCheck: sql`true` }),
]);

export const TeamInvites = pgTable("team_invites", {
  id: uuid().primaryKey().defaultRandom(),
  team_id: integer().notNull().references(() => Teams.id, { onDelete: "cascade" }),
  email: text().notNull(),
  admin: boolean().notNull()
}, table => [
  unique().on(table.team_id, table.email),
  pgPolicy('team_invites_query_key', { for: 'select', using: KeyAuthorized(table.team_id, scopes.teams.invites.read) }),
  pgPolicy('team_invites_query_team', { for: 'select', using: UserInTeam(table.team_id) }),
  pgPolicy('team_invites_query_user', {
    for: 'select',
    using:  sql`
    EXISTS (
      SELECT 1
      FROM ${sql.identifier(getTableName(user))}
      WHERE ${user.id} = ${UserId()}
        AND ${user.email} = ${table.email}
    )
    `
  }),
  pgPolicy('team_invites_insert_key', { for: 'insert', withCheck: KeyAuthorized(table.team_id, scopes.teams.invites.send) }),
  pgPolicy('team_invites_insert_user', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('team_invites_update', { for: 'update', using: sql`false` }),
  pgPolicy('team_invites_delete_key', { for: 'delete', using: KeyAuthorized(table.team_id, scopes.teams.invites.cancel) }),
  pgPolicy('team_invites_delete_user', { for: 'delete', using: UserIsTeamAdmin(table.team_id) })
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
  digest: char({ length: 64 }).notNull().unique(),
  name: text().notNull(),
  scopes: text().array().notNull(),
  is_fusion_server: boolean().notNull().default(false)
}, table => [
  unique().on(table.team_id, table.name),
  // Required so that API keys can check if they are able to access other stuff
  pgPolicy('team_keys_query_key', { for: "select", using: sql`${KeyDigest()} IS NOT NULL` }),
  pgPolicy('team_keys_query_user', { for: "select", using: UserInTeam(table.team_id) }),
  pgPolicy('team_keys_insert', { for: 'insert', withCheck: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('team_keys_delete', { for: 'delete', using: UserIsTeamAdmin(table.team_id) }),
  pgPolicy('team_keys_update', { for: 'update', using: UserIsTeamAdmin(table.team_id) })
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

export const TeamsRelationse = relations(Teams, ({ many, one }) => ({
  teamMembers: many(TeamMembers),
  teamInvites: many(TeamInvites),
  runners: many(TeamRunners),
  partCategories: many(PartCategories),
  boxTubes: many(BoxTubes),
  keys: many(TeamKeys),
  materials: many(Materials),
  machines: many(Machines),
  tools: many(Tools),
  creator: one(user, {
    fields: [Teams.owner],
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