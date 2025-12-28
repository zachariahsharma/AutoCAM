import { and, eq, getTableName, SQL, sql } from "drizzle-orm"
import { TeamKeys, TeamMembers } from "./entities"
import { PartCategories, Tools } from "./cam"

export function UserId() {
  return sql`current_setting('app.user_id', true)`
}

export function KeyDigest() {
  return sql`current_setting('app.key_digest', true)`
}

export function UserInTeam(tid: any): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${sql.identifier(getTableName(TeamMembers))}
    WHERE ${and(eq(TeamMembers.team_id, tid), eq(TeamMembers.user_id, UserId()))}
  )
  `
}

export function UserIsTeamAdmin(tid: any): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${sql.identifier(getTableName(TeamMembers))}
    WHERE ${and(eq(TeamMembers.team_id, tid), eq(TeamMembers.admin, sql`true`), eq(TeamMembers.user_id, UserId()))}
  )
  `
}

export function KeyAuthorized(teamId: any, scope: string): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(TeamKeys))}
    WHERE ${and(eq(TeamKeys.digest, KeyDigest()), eq(TeamKeys.team_id, teamId), eq(sql.raw(`'${scope}'`), sql`ANY(${TeamKeys.scopes})`))}
  )
  `
}

export function TeamFromCategoryId(cid: any) {
  return sql`
  (
    SELECT ${PartCategories.team_id}
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${eq(PartCategories.id, cid)}
  )
  `
}

export function TeamFromToolId(tid: any) {
  return sql`
  (
    SELECT ${Tools.team_id}
    FROM ${sql.identifier(getTableName(Tools))}
    WHERE ${eq(Tools.id, tid)}
  )
  `
}