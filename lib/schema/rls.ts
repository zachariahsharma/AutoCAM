import { and, eq, getTableName, SQL, sql } from "drizzle-orm"
import { TeamKeys, TeamMembers } from "./entities"

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
    WHERE ${and(eq(TeamMembers.team_id, tid), eq(TeamMembers.admin, true), eq(TeamMembers.user_id, UserId()))}
  )
  `
}

export function KeyAuthorized(teamId: any, scope: string): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(TeamKeys))}
    WHERE ${and(eq(TeamKeys.digest, KeyDigest()), eq(TeamKeys.team_id, teamId), eq(sql.raw(scope), sql`ANY(${TeamKeys.scopes})`))}
  )
  `
}