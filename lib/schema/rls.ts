import { getTableName, SQL, sql } from "drizzle-orm"
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
    WHERE ${TeamMembers.team_id} = ${tid}
      AND ${TeamMembers.user_id} = ${UserId()}
  )
  `
}

export function UserIsTeamAdmin(tid: any): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${sql.identifier(getTableName(TeamMembers))}
    WHERE ${TeamMembers.team_id} = ${tid}
      AND ${TeamMembers.admin} = true
      AND ${TeamMembers.user_id} = ${UserId()}
  )
  `
}

export function KeyAuthorized(teamId: any, scope: string): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(TeamKeys))}
    WHERE ${TeamKeys.digest} = ${KeyDigest()}
      AND ${TeamKeys.team_id} = ${teamId}
      AND '${sql.raw(scope)}' = ANY(${TeamKeys.scopes})
  )
  `
}