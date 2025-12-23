import { sql } from "drizzle-orm"

export function UserId() {
  return sql`current_setting('app.user_id', true)`
}

export function KeyDigest() {
  return sql`current_setting('app.key_digest', true)`
}

export function UserInTeam(tid: any) {
  return sql`
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = ${tid}
      AND tm.user_id = ${UserId()}
  )
  `
}

export function UserIsTeamAdmin(tid: any) {
  return sql`
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = ${tid}
      AND tm.admin = true
      AND tm.user_id = ${UserId()}
  )
  `
}

export function TeamFromKey() {
  return sql`
  (
    SELECT team_id
      FROM team_keys tk
      WHERE tk.digest = ${KeyDigest()}
  )
  `
}